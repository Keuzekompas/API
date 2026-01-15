import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  // Mock Repository
  const mockUserRepository = {
    findById: jest.fn(),
    findWithFavorites: jest.fn(),
    findByEmail: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  };

  // Mock Mongoose Model (needed because we use @Inject('USER_MODEL') in the constructor)
  const mockUserModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: 'USER_MODEL',
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should call repository.findById and return a user', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getFavorites', () => {
    const userId = 'user123';
    const mockRawModules = [
      {
        _id: 'mod1',
        name_en: 'English Name',
        name_nl: 'Nederlandse Naam',
        description_en: 'English Desc',
        description_nl: 'Nederlandse Desc',
        studycredit: 5,
        location: 'Breda',
      },
    ];

    it('should map favorites to English by default', async () => {
      mockUserRepository.findWithFavorites.mockResolvedValue({
        favoriteModules: mockRawModules,
      });

      const result = await service.getFavorites(userId);

      expect(result).toEqual({
        favorites: ['mod1'],
      });
    });

    it('should return just the ID when lang is "nl"', async () => {
      mockUserRepository.findWithFavorites.mockResolvedValue({
        favoriteModules: mockRawModules,
      });

      const result = await service.getFavorites(userId);

      expect(result?.favorites[0]).toBe('mod1');
    });

    it('should return null if user is not found', async () => {
      mockUserRepository.findWithFavorites.mockResolvedValue(null);
      const result = await service.getFavorites(userId);
      expect(result).toBeNull();
    });
  });

  describe('addFavorite', () => {
    it('should call repository.addFavorite', async () => {
      const userId = 'u1';
      const moduleId = 'm1';
      mockUserRepository.addFavorite.mockResolvedValue({ id: userId });

      await service.addFavorite(userId, moduleId);

      expect(repository.addFavorite).toHaveBeenCalledWith(userId, moduleId);
    });
  });

  describe('removeFavorite', () => {
    it('should call repository.removeFavorite', async () => {
      const userId = 'u1';
      const moduleId = 'm1';
      mockUserRepository.removeFavorite.mockResolvedValue({ id: userId });

      await service.removeFavorite(userId, moduleId);

      expect(repository.removeFavorite).toHaveBeenCalledWith(userId, moduleId);
    });
  });
});
