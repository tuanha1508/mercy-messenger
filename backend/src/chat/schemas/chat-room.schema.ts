import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { ApiProperty } from '@nestjs/swagger';

// Extended Document interface that includes both _id and id properties
export interface ChatRoomDocument extends ChatRoom, Document {
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
export class ChatRoom {
  @ApiProperty({
    description: 'The name of the chat room',
    example: 'Team Discussion'
  })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    description: 'The type of chat room',
    enum: ['direct', 'group'],
    example: 'group'
  })
  @Prop({ enum: ['direct', 'group'], default: 'direct' })
  type: string;

  @ApiProperty({
    description: 'List of user IDs who are participants in the chat room',
    type: [String],
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb']
  })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], required: true })
  participants: User[];

  @ApiProperty({
    description: 'The user ID of the creator of the chat room',
    example: '60d0fe4f5311236168a109ca'
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @ApiProperty({
    description: 'The text of the last message in the chat room',
    example: 'See you tomorrow!',
    nullable: true
  })
  @Prop({ default: null })
  lastMessage: string;

  @ApiProperty({
    description: 'The timestamp of the last message',
    type: Date,
    example: '2023-05-01T15:30:00.000Z',
    nullable: true
  })
  @Prop({ type: Date, default: null })
  lastMessageTime: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom); 