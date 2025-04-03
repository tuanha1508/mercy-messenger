import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The text content of the message',
    example: 'Hello, how are you doing?'
  })
  text: string;
  
  @ApiProperty({
    description: 'The avatar URL of the sender',
    required: false,
    example: 'https://example.com/avatar.jpg'
  })
  avatar?: string;
} 