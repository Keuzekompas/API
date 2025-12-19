import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
<<<<<<<< HEAD:src/user/repositories/user.repository.ts
import { UserDocument } from '../schemas/user.schema';
import { UserInterface } from '../interfaces/user.interface';
========
import { UserDocument } from './user.schema';
import { UserInterface } from './user.interface';
import { LoginResponse } from 'src/auth/auth.interface';
>>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0:src/user/user.repository.ts

@Injectable()
export class UserRepository {
  constructor(
    @Inject('USER_MODEL')
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserInterface | null> {
    return this.userModel
      .findById(id)
      .select('-password -__v')
      .lean<UserInterface>()
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+id')
      .lean<UserDocument>()
      .exec();
  }
}