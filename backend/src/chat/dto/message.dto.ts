import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    description: 'The unique identifier of the message',
    example: '60d0fe4f5311236168a109ce'
  })
  id: string;

  @ApiProperty({
    description: 'The text content of the message',
    example: 'Hello, how are you doing?'
  })
  text: string;

  @ApiProperty({
    description: 'The image URL for image messages',
    required: false,
    example: '/uploads/abc123-image.jpg'
  })
  image?: string;

  @ApiProperty({
    description: 'The user ID of the sender',
    example: '60d0fe4f5311236168a109ca'
  })
  user: string;

  @ApiProperty({
    description: 'The chat room ID where the message was sent',
    example: '60d0fe4f5311236168a109cd'
  })
  room: string;

  @ApiProperty({
    description: 'The timestamp when the message was created',
    type: Date,
    example: '2023-05-01T15:30:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the message was last updated',
    type: Date,
    example: '2023-05-01T15:30:00.000Z'
  })
  updatedAt: Date;
} 