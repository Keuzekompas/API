import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Module } from '../modules/module.schema';

@Schema()
export class User {
  @Prop({
    required: true,
    minlength: 8,
  })
  password: string;

  @Prop({
    required: true,
    unique: true,
    validate: {
      validator: (v: number) => v.toString().length === 7,
      message: 'Student number must contain exactly 7 digits',
    },
  })
  studentNumber: number;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@student\.avans\.nl$/,
      'Invalid Avans student email address',
    ],
  })
  email: string;

  @Prop({
    required: true,
    minlength: 1,
    maxlength: 255,
    match: [/^[\p{L} .'-]+$/u, 'Name contains invalid characters'],
  })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Modules' }] })
  favoriteModules: Module[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
