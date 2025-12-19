import { Test, TestingModule } from '@nestjs/testing';
import { ModulesService } from '../modules.service';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '../module.interface';

describe('ModulesService', () => {
  let service: ModulesService;
  let model: Model<Module>;

  const mockModule = {
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
    model = module.get<Model<Module>>('MODULE_MODEL');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of modules', async () => {
      console.log('Test: ModulesService.findAll - Start');
      const result = [mockModule];

      mockModuleModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      });

      const modules = await service.findAll();
      console.log('Test: ModulesService.findAll - Result:', modules);
      expect(modules).toEqual(result);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a module if found', async () => {
      console.log('Test: ModulesService.findOne - Start');
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModule),
      });

      const foundModule = await service.findOne('someId');
      console.log('Test: ModulesService.findOne - Result:', foundModule);
      expect(foundModule).toEqual(mockModule);
      expect(model.findById).toHaveBeenCalledWith('someId');
    });

    it('should throw NotFoundException if module not found', async () => {
      console.log('Test: ModulesService.findOne (Error) - Start');
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      try {
        await service.findOne('someId');
      } catch (error) {
        console.log(
          'Test: ModulesService.findOne (Error) - Caught Error:',
          error.message,
        );
        expect(error).toBeInstanceOf(NotFoundException);
      }
      expect(model.findById).toHaveBeenCalledWith('someId');
    });
  });
});
