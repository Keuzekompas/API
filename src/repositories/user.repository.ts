import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../schemas/user.schema';
import { UserInterface } from '../interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
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
    return this.userModel.findOne({ email }).exec();
  }
}
