import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { UserInterface } from './user.interface';

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
