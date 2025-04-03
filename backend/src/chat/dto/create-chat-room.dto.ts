import { ApiProperty } from '@nestjs/swagger';

export class CreateChatRoomDto {
  @ApiProperty({
    description: 'The name of the chat room',
    example: 'Team Discussion'
  })
  name: string;

  @ApiProperty({
    description: 'The type of chat room',
    enum: ['direct', 'group'],
    default: 'direct',
    example: 'group'
  })
  type: string;

  @ApiProperty({
    description: 'List of user IDs who are participants in the chat room',
    type: [String],
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb']
  })
  participants: string[];
} 