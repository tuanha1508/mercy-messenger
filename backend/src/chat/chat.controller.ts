import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Req,
  Patch,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatRoomDto } from './dto/chat-room.dto';
import { MessageDto } from './dto/message.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return user chat rooms',
    type: [ChatRoomDto]
  })
  async getChatRooms(@Req() req) {
    return this.chatService.getChatRooms(req.user.userId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get a specific chat room' })
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return a chat room',
    type: ChatRoomDto
  })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async getChatRoom(@Param('id') id: string) {
    return this.chatService.getChatRoom(id);
  }

  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ 
    status: 201, 
    description: 'Chat room created successfully',
    type: ChatRoomDto
  })
  async createChatRoom(@Body() data: CreateChatRoomDto, @Req() req) {
    return this.chatService.createChatRoom({
      ...data,
      createdBy: req.user.userId,
      participants: [...data.participants, req.user.userId],
    });
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat room' })
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to return' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of messages to skip' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return chat room messages',
    type: [MessageDto]
  })
  async getMessages(
    @Param('id') chatRoomId: string,
    @Query('limit') limit: number = 50,
    @Query('skip') skip: number = 0,
  ) {
    return this.chatService.getMessages(chatRoomId, limit, skip);
  }

  @Post('rooms/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to a chat room' })
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully',
    type: MessageDto
  })
  async sendMessage(
    @Param('id') chatRoomId: string,
    @Body() data: CreateMessageDto,
    @Req() req,
  ) {
    return this.chatService.createMessage({
      ...data,
      room: chatRoomId,
      user: req.user.userId,
    });
  }

  @Post('rooms/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload an image to a chat room' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        avatar: {
          type: 'string',
          description: 'User avatar URL'
        }
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Image uploaded successfully',
    type: MessageDto
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') chatRoomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req,
  ) {
    return this.chatService.createImageMessage({
      room: chatRoomId,
      user: req.user.userId,
      file,
      avatar: body.avatar
    });
  }

  @Patch('rooms/:id/typing')
  @ApiOperation({ summary: 'Send typing status for a chat room' })
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        isTyping: {
          type: 'boolean',
          example: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Typing status updated',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        }
      }
    }
  })
  async sendTypingStatus(
    @Param('id') chatRoomId: string, 
    @Body() data: { isTyping: boolean },
    @Req() req
  ) {
    // In a real-time application, we would broadcast this to other users
    // For now, we'll just acknowledge receipt
    return { success: true };
  }
} 