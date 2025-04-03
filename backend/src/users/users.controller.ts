import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
  Res
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Configure file upload storage
const storage = diskStorage({
  destination: './uploads/profile-pictures',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `profile-${uniqueSuffix}${ext}`);
  },
});

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users by name' })
  @ApiResponse({ status: 200, description: 'Return users matching search query' })
  async search(@Query('q') query: string): Promise<User[]> {
    return this.usersService.searchByName(query);
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('profilePicture', { storage }))
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    const imagePath = `/uploads/profile-pictures/${file.filename}`;
    
    return this.usersService.updateProfilePicture(userId, imagePath);
  }
  
  @Get('profile-pictures/:filename')
  getProfilePicture(@Param('filename') filename: string, @Res() res) {
    return res.sendFile(filename, { root: './uploads/profile-pictures' });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Return user by id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by id' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiResponse({ status: 204, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
} 