import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Extended Document interface that includes both _id and id properties
export interface UserDocument extends User, Document {
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
      delete ret.password;
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
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: ['volunteer', 'staff', 'adopter'], default: 'volunteer' })
  role: string;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ type: Date, default: null })
  lastActive: Date;

  @Prop({ default: null })
  profilePicture: string;

  @Prop({ default: [] })
  chatRooms: string[];
}

export const UserSchema = SchemaFactory.createForClass(User); 