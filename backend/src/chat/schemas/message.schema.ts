import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { ChatRoom } from './chat-room.schema';
import { ApiProperty } from '@nestjs/swagger';

// Extended Document interface that includes both _id and id properties
export interface MessageDocument extends Message, Document {
  _id: any;
  id?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      return ret;
    },
  },
})
export class Message {
  @ApiProperty({
    description: 'The text content of the message',
    example: 'Hello, how are you doing?'
  })
  @Prop({ required: true })
  text: string;

  @ApiProperty({
    description: 'The image URL for image messages',
    required: false,
    example: '/uploads/abc123-image.jpg'
  })
  @Prop()
  image?: string;

  @ApiProperty({
    description: 'The avatar URL of the sender',
    required: false,
    example: 'https://example.com/avatar.jpg'
  })
  @Prop()
  avatar?: string;

  @ApiProperty({
    description: 'The user ID of the sender',
    example: '60d0fe4f5311236168a109ca'
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @ApiProperty({
    description: 'The chat room ID where the message was sent',
    example: '60d0fe4f5311236168a109cd'
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ChatRoom', required: true })
  room: ChatRoom;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 