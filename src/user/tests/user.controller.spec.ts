import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    findById: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavoriteModules', () => {
    it('should return favorite modules', async () => {
      const userId = 'someUserId';
      const mockModules = ['1', '2'];
      const mockResponse = { favorites: mockModules };
      mockUserService.getFavorites.mockResolvedValue(mockResponse);

      const req = { user: { userId } };
      const result = await controller.getFavoriteModules(req);

      expect(result).toEqual({
        status: 200,
        message: 'Favorite modules successfully retrieved',
        data: mockResponse,
      });
      expect(mockUserService.getFavorites).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException if no user is logged in', async () => {
      const req = { user: {} };
      await expect(controller.getFavoriteModules(req)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'someUserId';
      mockUserService.getFavorites.mockResolvedValue(null);

      const req = { user: { userId } };
      await expect(controller.getFavoriteModules(req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addFavorite', () => {
    const validModuleId = new Types.ObjectId().toHexString();

    it('should add a favorite module', async () => {
      const userId = 'someUserId';
      mockUserService.addFavorite.mockResolvedValue({ id: userId, favoriteModules: [validModuleId] });

      const req = { user: { userId } };
      const result = await controller.addFavorite(req, validModuleId);

      expect(result).toEqual({
        status: 200,
        message: 'Module added to favorites',
        data: {},
      });
      expect(mockUserService.addFavorite).toHaveBeenCalledWith(userId, validModuleId);
    });

    it('should throw BadRequestException for invalid module ID', async () => {
      const req = { user: { userId: 'someUserId' } };
      await expect(controller.addFavorite(req, 'invalidId')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if no user is logged in', async () => {
      const req = { user: {} };
      await expect(controller.addFavorite(req, validModuleId)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'someUserId';
      mockUserService.addFavorite.mockResolvedValue(null);

      const req = { user: { userId } };
      await expect(controller.addFavorite(req, validModuleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFavorite', () => {
    const validModuleId = new Types.ObjectId().toHexString();

    it('should remove a favorite module', async () => {
      const userId = 'someUserId';
      mockUserService.removeFavorite.mockResolvedValue({ id: userId, favoriteModules: [] });

      const req = { user: { userId } };
      const result = await controller.removeFavorite(req, validModuleId);

      expect(result).toEqual({
        status: 200,
        message: 'Module removed from favorites',
        data: {},
      });
      expect(mockUserService.removeFavorite).toHaveBeenCalledWith(userId, validModuleId);
    });

    it('should throw BadRequestException for invalid module ID', async () => {
      const req = { user: { userId: 'someUserId' } };
      await expect(controller.removeFavorite(req, 'invalidId')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if no user is logged in', async () => {
      const req = { user: {} };
      await expect(controller.removeFavorite(req, validModuleId)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'someUserId';
      mockUserService.removeFavorite.mockResolvedValue(null);

      const req = { user: { userId } };
      await expect(controller.removeFavorite(req, validModuleId)).rejects.toThrow(NotFoundException);
    });
  });
});
