import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'mercyfull-messenger-secret-key',
    });
  }

  async validate(payload: any) {
    // Fetch the complete user from database to get all user data including profilePicture
    const user = await this.usersService.findById(payload.sub);
    
    // If user exists, return complete profile with profilePicture
    if (user) {
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        name: user.name,
        profilePicture: user.profilePicture
      };
    }
    
    // Fallback to just token data if user not found
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
} 