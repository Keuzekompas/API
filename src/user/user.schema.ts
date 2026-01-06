import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  studentNumber: number;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@student\.avans\.nl$/,
      'Please fill a valid Avans student email',
    ],
  })
  email: string;

  @Prop({ required: true })
  name: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
