import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, userData, { new: true })
      .select('-password')
      .exec();
      
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateProfilePicture(userId: string, imagePath: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId, 
        { profilePicture: imagePath },
        { new: true }
      )
      .select('-password')
      .exec();
      
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<User | null> {
    const updates: any = { isOnline };
    if (!isOnline) {
      updates.lastActive = new Date();
    }
    
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .select('-password')
      .exec();
    
    if (!updatedUser) {
      return null;
    }
    
    return updatedUser;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async searchByName(query: string): Promise<User[]> {
    // Create a case-insensitive regex pattern to search by name
    const nameRegex = new RegExp(query, 'i');
    
    return this.userModel
      .find({ name: nameRegex })
      .select('-password')
      .exec();
  }
} 