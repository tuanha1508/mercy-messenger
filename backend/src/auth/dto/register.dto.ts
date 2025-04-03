import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123'
  })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: ['volunteer', 'staff', 'adopter'],
    default: 'volunteer',
    example: 'volunteer'
  })
  role?: string;
} 