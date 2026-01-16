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

  async findWithFavorites(id: string): Promise<UserInterface | null> {
    return this.userModel
      .findById(id)
      .select('favoriteModules')
      .lean<UserInterface>()
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).lean<UserDocument>().exec();
  }

  async addFavorite(
    userId: string,
    moduleId: string,
  ): Promise<UserInterface | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteModules: moduleId } },
        { new: true },
      )
      .select('id')
      .lean<UserInterface>()
      .exec();
  }

  async removeFavorite(
    userId: string,
    moduleId: string,
  ): Promise<UserInterface | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { favoriteModules: moduleId } },
        { new: true },
      )
      .select('id')
      .lean<UserInterface>()
      .exec();
  }
}
