import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { UsersService } from '../users/users.service';
import { Express } from 'express';
import * as Multer from 'multer';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
  ) {}

  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomModel
      .find({ participants: userId })
      .sort({ lastMessageTime: -1 })
      .populate('participants', '-password')
      .exec();
  }

  async getChatRoom(id: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomModel
      .findById(id)
      .populate('participants', '-password')
      .exec();
      
    if (!chatRoom) {
      throw new NotFoundException(`Chat room with ID ${id} not found`);
    }
    
    return chatRoom;
  }

  async createChatRoom(data: any): Promise<ChatRoom> {
    // Ensure all participants exist
    for (const participantId of data.participants) {
      await this.usersService.findById(participantId);
    }
    
    const chatRoom = new this.chatRoomModel({
      ...data,
      lastMessageTime: new Date(),
    });
    
    return chatRoom.save();
  }

  async getMessages(chatRoomId: string, limit = 50, skip = 0): Promise<Message[]> {
    return this.messageModel
      .find({ room: chatRoomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', '-password')
      .exec();
  }

  async createMessage(data: any): Promise<Message | null> {
    try {
      console.log(`Attempting to create message: ${JSON.stringify({
        room: data.room,
        user: data.user,
        text: data.text?.substring(0, 30) + (data.text?.length > 30 ? '...' : ''),
      })}`);
      
      // Ensure chat room exists
      const chatRoom = await this.getChatRoom(data.room);
      console.log(`Found chat room: ${(chatRoom as ChatRoomDocument).id || (chatRoom as ChatRoomDocument)._id}`);
      
      // Validate required fields
      if (!data.text) {
        console.error('Message validation failed: text is required');
        throw new Error('Message text is required');
      }
      
      if (!data.user) {
        console.error('Message validation failed: user is required');
        throw new Error('Message user is required');
      }
      
      // Create message with avatar if provided
      const message = new this.messageModel({
        text: data.text,
        room: data.room,
        user: data.user,
        avatar: data.avatar, // Include avatar if provided
      });
      
      console.log('Saving message to database...');
      const savedMessage = await message.save();
      console.log(`Message saved successfully with ID: ${savedMessage._id}`);
      
      // Update chat room's last message
      console.log(`Updating last message for chat room: ${data.room}`);
      await this.chatRoomModel.findByIdAndUpdate(
        data.room,
        { 
          lastMessage: data.text,
          lastMessageTime: new Date(),
        },
      );
      console.log('Chat room updated with last message');
      
      const populatedMessage = await this.messageModel
        .findById(savedMessage._id)
        .populate('user', '-password')
        .exec();
        
      if (!populatedMessage) {
        console.error(`Failed to retrieve populated message after save: ${savedMessage._id}`);
        return null;
      }
      
      console.log(`Message created and populated successfully: ${populatedMessage._id}`);
      return populatedMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async createImageMessage(data: { room: string; user: string; file: Express.Multer.File; avatar?: string }): Promise<Message | null> {
    // Ensure chat room exists
    await this.getChatRoom(data.room);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create a unique filename
    const filename = `${uuidv4()}-${data.file.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save the file
    fs.writeFileSync(filepath, data.file.buffer);
    
    // Create relative path for storage in database
    const relativeFilePath = `/uploads/${filename}`;
    
    // Create message
    const message = new this.messageModel({
      text: 'Image', // Placeholder text for image messages
      room: data.room,
      user: data.user,
      image: relativeFilePath,
      avatar: data.avatar, // Include avatar if provided
    });
    
    const savedMessage = await message.save();
    
    // Update chat room's last message
    await this.chatRoomModel.findByIdAndUpdate(
      data.room,
      { 
        lastMessage: 'Image',
        lastMessageTime: new Date(),
      },
    );
    
    const populatedMessage = await this.messageModel
      .findById(savedMessage._id)
      .populate('user', '-password')
      .exec();
      
    if (!populatedMessage) {
      return null;
    }
    
    return populatedMessage;
  }
} 