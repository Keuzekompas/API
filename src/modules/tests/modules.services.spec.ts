import { Test, TestingModule } from '@nestjs/testing';
import { ModulesService } from '../modules.service';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '../module.interface';
import { GetModulesQueryDto } from '../dtos/get-modules-query.dto';

describe('ModulesService', () => {
  let service: ModulesService;
  let model: Model<Module>;

  const mockModule = {
    _id: '507f1f77bcf86cd799439011',
    name_en: 'Test Module',
    description_en: 'Description',
    studycredit: 5,
    location: 'Eindhoven',
    level: 'HBO',
    module_tags_en: ['Tag1'],
    start_date: new Date(),
    available_spots: 20,
    name_nl: 'Test Module NL',
    description_nl: 'Beschrijving',
    module_tags_nl: ['Tag1'],
  };

  const mockModuleModel = {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        {
          provide: 'MODULE_MODEL',
          useValue: mockModuleModel,
        },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of mapped modules with default pagination', async () => {
      const result = [mockModule];
      const query: GetModulesQueryDto = { lang: 'en', page: 1, limit: 10 };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(result),
      };
      mockModuleModel.find.mockReturnValue(mockChain);

      const modules = await service.findAll(query);

      const expected = {
        modules: [
          {
            _id: mockModule._id,
            name: mockModule.name_en,
            description: mockModule.description_en,
            studycredit: mockModule.studycredit,
            location: mockModule.location,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      expect(modules).toEqual(expected);
      expect(mockModuleModel.find).toHaveBeenCalledWith({});
      expect(mockChain.select).toHaveBeenCalledWith(
        'name_en description_en studycredit location',
      );
      expect(mockChain.lean).toHaveBeenCalled();
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should apply filters correctly', async () => {
      const query: GetModulesQueryDto = {
        lang: 'nl',
        page: 2,
        limit: 5,
        search: 'test',
        location: 'Eindhoven',
        studycredit: 5,
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockModule]),
      };
      mockModuleModel.find.mockReturnValue(mockChain);

      await service.findAll(query);

      const expectedFilter = {
        name_nl: { $regex: 'test', $options: 'i' },
        location: 'Eindhoven',
        studycredit: 5,
      };

      expect(mockModuleModel.find).toHaveBeenCalledWith(expectedFilter);
      expect(mockChain.select).toHaveBeenCalledWith(
        'name_nl description_nl studycredit location',
      );
      expect(mockChain.skip).toHaveBeenCalledWith(5);
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('should return a mapped module if found', async () => {
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModule),
      });

      const foundModule = await service.findOne('507f1f77bcf86cd799439011');

      const expected = {
        _id: mockModule._id,
        name: mockModule.name_en,
        description: mockModule.description_en,
        studycredit: mockModule.studycredit,
        location: mockModule.location,
        level: mockModule.level,
        start_date: mockModule.start_date.toISOString(),
        module_tags: mockModule.module_tags_en,
      };

      expect(foundModule).toEqual(expected);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
