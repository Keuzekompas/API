import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import { UserDocument } from './user.schema';
import { UserInterface } from 'src/user/user.interface';
import { FavoritesResponseDto } from './dtos/favorites-response.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('USER_MODEL') private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserInterface | null> {
    return await this.userRepository.findById(id);
  }

  async getFavorites(id: string): Promise<FavoritesResponseDto | null> {
    const user = await this.userRepository.findWithFavorites(id);
    if (!user) return null;

    const favorites = (user.favoriteModules as any[]).map((module) =>
      module._id ? module._id.toString() : module.toString(),
    );

    return { favorites };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userRepository.findByEmail(email);
  }

  async addFavorite(userId: string, moduleId: string): Promise<UserInterface | null> {
    return await this.userRepository.addFavorite(userId, moduleId);
  }

  async removeFavorite(userId: string, moduleId: string): Promise<UserInterface | null> {
    return await this.userRepository.removeFavorite(userId, moduleId);
  }
}
