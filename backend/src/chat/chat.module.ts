import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {} 