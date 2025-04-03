import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    
    if (await this.comparePasswords(password, user.password)) {
      // Cast to UserDocument to access toObject method
      const userDoc = user as UserDocument;
      const { password, ...result } = userDoc.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(userData: any) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Create new user
    const newUser = await this.usersService.create(userData) as UserDocument;
    const { password, ...result } = newUser.toObject();
    
    // Generate token
    const payload = { email: result.email, sub: result._id, role: result.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result._id,
        email: result.email,
        name: result.name,
        role: result.role,
      },
    };
  }

  private async comparePasswords(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
} 