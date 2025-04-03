import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { ChatRoomDocument } from './schemas/chat-room.schema';
import { MessageDocument } from './schemas/message.schema';
import { Document } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';

// Define interfaces needed for WebSocket operations
interface CustomMessage {
  _id?: string | any;
  id?: string;
  text?: string;
  room?: string;
  roomId?: string;
  user: CustomUser;
  createdAt?: Date;
  toObject?: () => any;
  [key: string]: any;
}

interface CustomUser {
  _id?: string | any;
  id?: string;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

interface ImageResult {
  url: string;
  [key: string]: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  pingInterval: 10000,
  pingTimeout: 15000,
  connectTimeout: 30000,
  maxHttpBufferSize: 1e8, // 100 MB for image upload support
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, string>(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake query
      const token = client.handshake.auth.token || client.handshake.query.token as string;
      if (!token) {
        console.error('Connection rejected: No token provided');
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify token
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (tokenError) {
        console.error('Connection rejected: Invalid token', tokenError.message);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }
      
      const userId = payload.sub;
      if (!userId) {
        console.error('Connection rejected: Token missing user ID');
        client.emit('error', { message: 'Invalid user information' });
        client.disconnect();
        return;
      }

      // Store client connection
      this.connectedClients.set(userId, client.id);
      
      // Update user's online status
      try {
        await this.usersService.updateOnlineStatus(userId, true);
      } catch (statusError) {
        console.warn('Error updating online status:', statusError.message);
        // Continue connection process despite this error
      }

      // Join user to their chat room channels
      try {
        const chatRooms = await this.chatService.getChatRooms(userId);
        if (Array.isArray(chatRooms)) {
          chatRooms.forEach((room: any) => {
            // Get the room ID from either the MongoDB _id or document id
            const roomId = room._id?.toString() || room.id;
            if (roomId) {
              client.join(`chat_room_${roomId}`);
            }
          });
        }
      } catch (roomError) {
        console.warn('Error joining chat rooms:', roomError.message);
        // Continue connection process despite this error
      }

      console.log(`Client connected: ${userId}`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.emit('error', { message: 'Server error during connection' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      // Find userId by socketId
      let disconnectedUserId: string | null = null;
      for (const [userId, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        // Remove from connected clients
        this.connectedClients.delete(disconnectedUserId);
        
        // Update user's online status
        await this.usersService.updateOnlineStatus(disconnectedUserId, false);
        
        console.log(`Client disconnected: ${disconnectedUserId}`);
      }
    } catch (error) {
      console.error('Disconnection error:', error.message);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`chat_room_${data.roomId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`chat_room_${data.roomId}`);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string, text: string, avatar?: string },
  ) {
    try {
      console.log(`Socket message received: roomId=${data.roomId}, text=${data.text?.substring(0, 30)}${data.text?.length > 30 ? '...' : ''}`);
      
      // Extract user ID from connected clients
      let senderId: string | null = null;
      for (const [userId, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          senderId = userId;
          break;
        }
      }

      if (!senderId) {
        console.error('Socket authentication failed: user not found in connected clients');
        client.emit('error', { message: 'User not authenticated' });
        throw new Error('User not authenticated');
      }

      console.log(`Message sender identified: ${senderId}`);

      // Helper function to safely get the message ID
      const getMessageId = (msg: any): string => {
        if ('_id' in msg) {
          return msg._id.toString();
        }
        if ('id' in msg) {
          return msg.id.toString();
        }
        return Math.random().toString(); // Fallback
      };

      // Create message in database
      console.log('Calling chatService.createMessage...');
      const message = await this.chatService.createMessage({
        room: data.roomId,
        user: senderId,
        text: data.text,
        avatar: data.avatar,
      });

      if (!message) {
        console.error('Failed to create message in database');
        client.emit('error', { message: 'Failed to create message' });
        throw new Error('Failed to create message');
      }

      console.log(`Message created successfully: ${getMessageId(message)}`);

      // Cast message to MessageDocument to access mongoose methods
      const messageDoc = message as MessageDocument;

      // Ensure the message has the proper user information
      const messageWithUser = {
        ...(messageDoc.toObject ? messageDoc.toObject() : message),
        id: getMessageId(message),
        user: {
          _id: senderId,
          avatar: data.avatar
        }
      };

      console.log(`Broadcasting message to room: chat_room_${data.roomId}`);
      // Broadcast to all users in the room
      this.server.to(`chat_room_${data.roomId}`).emit('newMessage', messageWithUser);
      console.log('Message broadcast completed');

      return { success: true, messageId: getMessageId(message) };
    } catch (error) {
      console.error('Send message error:', error);
      // Send error back to the client
      client.emit('messageError', { 
        error: error.message || 'Unknown error sending message',
        timestamp: new Date().toISOString()
      });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string, isTyping: boolean },
  ) {
    try {
      // Find user ID
      let userId: string | null = null;
      for (const [id, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          userId = id;
          break;
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Broadcast typing status to everyone else in the room
      client.to(`chat_room_${data.roomId}`).emit('userTyping', {
        roomId: data.roomId,
        userId,
        isTyping: data.isTyping,
      });

      return { success: true };
    } catch (error) {
      console.error('Typing indicator error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string, limit?: number, skip?: number },
  ) {
    try {
      // Find user ID
      let userId: string | null = null;
      for (const [id, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          userId = id;
          break;
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get messages from service - Modify to match expected method signature
      const messages = await this.chatService.getMessages(
        data.roomId, 
        data.limit || 20, 
        data.skip || 0
      );
      
      return { 
        success: true, 
        messages: Array.isArray(messages) ? messages.map((msg: any) => {
          const user = msg.user || {};
          return {
            ...msg,
            id: msg._id?.toString() || msg.id,
            user: {
              _id: user._id?.toString() || user.id,
              name: user.name,
              avatar: user.avatar
            }
          };
        }) : []
      };
    } catch (error) {
      console.error('Get messages error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getChatRoom')
  async handleGetChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      // Find user ID
      let userId: string | null = null;
      for (const [id, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          userId = id;
          break;
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get chat room - Adapt this call to your service's actual method
      const room = await this.chatService.getChatRoom(data.roomId);
      
      // Get participants manually if needed
      let participants: any[] = [];
      try {
        // Try to access participants method if it exists
        if (typeof this.usersService['getRoomParticipants'] === 'function') {
          participants = await this.usersService['getRoomParticipants'](data.roomId);
        } else if (room.participants) {
          // Use existing participants if they exist
          participants = room.participants as any[];
        }
      } catch (e) {
        console.warn('Could not get room participants:', e.message);
      }
      
      // Return room with participants
      return { 
        success: true, 
        room: {
          ...room,
          participants
        }
      };
    } catch (error) {
      console.error('Get chat room error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getCurrentUser')
  async handleGetCurrentUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string, token?: string } = {},
  ) {
    try {
      // Find user ID
      let userId: string | null = null;
      
      // First, try to get the userId from the connectedClients map
      for (const [id, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          userId = id;
          break;
        }
      }

      // Fallback: If no userId was found in the map, try to extract it from the client's handshake data
      if (!userId) {
        // Try to get user info from token in handshake
        try {
          // First, try token from message data
          let token = data.token;
          
          // If not in data, try from socket handshake
          if (!token) {
            token = client.handshake.auth?.token || 
                  client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  client.handshake.query?.token as string;
          }
                       
          if (token) {
            const decoded = this.jwtService.verify(token);
            if (decoded && (decoded.userId || decoded.sub)) {
              userId = decoded.userId || decoded.sub;
              console.log('Retrieved userId from token:', userId);
              
              // Update connectedClients map for future use
              if (userId) {
                this.connectedClients.set(userId, client.id);
              }
            }
          }
        } catch (tokenError) {
          console.error('Error extracting user from token:', tokenError.message);
        }
      }

      // If still no userId, try the userId from the message data
      if (!userId && data.userId) {
        userId = data.userId;
        // Update the connectedClients map
        this.connectedClients.set(userId, client.id);
      }

      // As a last resort, look for a userId in the handshake query
      if (!userId) {
        const queryUserId = client.handshake.query?.userId as string;
        if (queryUserId) {
          userId = queryUserId;
          
          // Update the connectedClients map
          this.connectedClients.set(userId, client.id);
        }
      }

      // If we still don't have a user ID, return an error
      if (!userId) {
        console.error('Failed to identify user for getCurrentUser');
        return { success: false, error: 'User not authenticated' };
      }

      console.log(`Getting user info for user: ${userId}`);
      
      // Get user details from the database
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        console.error('User not found in database:', userId);
        return { success: false, error: 'User not found' };
      }
      
      // Cast to UserDocument to access _id
      const userDoc = user as unknown as UserDocument;
      
      // Format the user data to return
      const userData = {
        id: userDoc._id?.toString() || userId,
        name: user.name || 'Unknown User',
        email: user.email || null,
        profilePicture: user.profilePicture || null,
      };
      
      console.log('Returning user data:', JSON.stringify(userData));
      
      return { 
        success: true, 
        user: userData
      };
    } catch (error) {
      console.error('Get current user error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('sendImageMessage')
  async handleSendImageMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string, imageUri: string },
  ) {
    try {
      // Find user ID
      let userId: string | null = null;
      for (const [id, socketId] of this.connectedClients.entries()) {
        if (socketId === client.id) {
          userId = id;
          break;
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Process and store the image
      const image = await this.processAndStoreImage(data.imageUri, userId);
      
      // Create message with image
      const message = await this.chatService.createMessage({
        room: data.roomId,
        user: userId,
        image: image.url,
      });

      if (!message) {
        throw new Error('Failed to create image message');
      }

      // Safely extract and convert message properties
      let messageObj: any;
      const msgAny = message as any;
      try {
        messageObj = typeof msgAny.toObject === 'function' ? msgAny.toObject() : message;
      } catch (e) {
        messageObj = { ...message };
      }
      
      // Get message ID safely
      const messageId = msgAny._id?.toString() || msgAny.id?.toString() || Math.random().toString();

      // Create the message format expected by clients
      const messageWithUser = {
        ...messageObj,
        id: messageId,
        user: {
          _id: userId
        }
      };

      // Broadcast to all users in the room
      this.server.to(`chat_room_${data.roomId}`).emit('newMessage', messageWithUser);
      
      return { 
        success: true, 
        messageId: messageId,
        imageUrl: image.url
      };
    } catch (error) {
      console.error('Send image message error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Implement image processing method if it doesn't exist in ChatService
  private async processAndStoreImage(imageUri: string, userId: string): Promise<ImageResult> {
    try {
      // If ChatService has this method, use it
      if (typeof this.chatService['processAndStoreImage'] === 'function') {
        try {
          return await this.chatService['processAndStoreImage'](imageUri, userId);
        } catch (error) {
          console.error('Error in ChatService.processAndStoreImage:', error);
          // Fall back to our implementation if ChatService method fails
        }
      }
      
      // Our implementation (used as fallback)
      console.log(`Processing image from URI: ${imageUri.substring(0, 30)}...`);
      
      // Validate imageUri to ensure it's a valid URL or base64 string
      if (!imageUri) {
        throw new Error('Empty image URI provided');
      }
      
      if (typeof imageUri !== 'string') {
        throw new Error('Invalid image URI format: must be a string');
      }
      
      // Here we would typically:
      // 1. Decode the base64 image or fetch from URL
      // 2. Resize/compress the image as needed
      // 3. Upload to storage (S3, etc)
      // 4. Return the URL of the stored image
      
      // For now, we'll just return the original URI as the URL
      return { 
        url: imageUri,
        originalUrl: imageUri,
        userId: userId,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process and store image: ${error.message}`);
    }
  }
} 