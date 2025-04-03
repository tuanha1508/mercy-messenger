import { ApiProperty } from '@nestjs/swagger';

export class ChatRoomDto {
  @ApiProperty({
    description: 'The unique identifier of the chat room',
    example: '60d0fe4f5311236168a109cd'
  })
  id: string;

  @ApiProperty({
    description: 'The name of the chat room',
    example: 'Team Discussion'
  })
  name: string;

  @ApiProperty({
    description: 'The type of chat room',
    enum: ['direct', 'group'],
    example: 'group'
  })
  type: string;

  @ApiProperty({
    description: 'List of user IDs who are participants in the chat room',
    type: [String],
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb']
  })
  participants: string[];

  @ApiProperty({
    description: 'The user ID of the creator of the chat room',
    example: '60d0fe4f5311236168a109ca'
  })
  createdBy: string;

  @ApiProperty({
    description: 'The text of the last message in the chat room',
    example: 'See you tomorrow!',
    nullable: true
  })
  lastMessage: string | null;

  @ApiProperty({
    description: 'The timestamp of the last message',
    type: Date,
    example: '2023-05-01T15:30:00.000Z',
    nullable: true
  })
  lastMessageTime: Date | null;

  @ApiProperty({
    description: 'The timestamp when the chat room was created',
    type: Date,
    example: '2023-05-01T12:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the chat room was last updated',
    type: Date,
    example: '2023-05-01T15:30:00.000Z'
  })
  updatedAt: Date;
} 