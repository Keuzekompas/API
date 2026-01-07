import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UserInterface } from 'src/user/user.interface';
import { ModuleListDto } from 'src/modules/dtos/module-response.dto';
import { Module } from 'src/modules/module.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserInterface | null> {
    return await this.userRepository.findById(id);
  }

  async getFavorites(
    id: string,
    lang: string = 'en',
  ): Promise<ModuleListDto[] | null> {
    const user = await this.userRepository.findWithFavorites(id);
    if (!user) return null;

    const favorites = user.favoriteModules as Module[];

    return favorites.map((module) => ({
      _id: module._id.toString(),
      name: lang === 'nl' ? module.name_nl : module.name_en,
      description:
        lang === 'nl' ? module.description_nl : module.description_en,
      studycredit: module.studycredit,
      location: module.location,
    }));
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userRepository.findByEmail(email);
  }
}
