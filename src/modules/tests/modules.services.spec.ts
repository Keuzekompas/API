import { Test, TestingModule } from '@nestjs/testing';
import { ModulesService } from '../modules.service';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '../module.interface';

describe('ModulesService', () => {
  let service: ModulesService;
  let model: Model<Module>;

  const mockModule = {
    _id: '5',
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
    it('should return an array of mapped modules (default en)', async () => {
      console.log('Test: ModulesService.findAll - Start');
      const result = [mockModule];

      mockModuleModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      });

      const modules = await service.findAll();
      console.log('Test: ModulesService.findAll - Result:', modules);
      
      const expected = [{
        _id: mockModule['_id'],
        name: mockModule.name_en,
        description: mockModule.description_en,
        studycredit: mockModule.studycredit,
        location: mockModule.location
      }];

      expect(modules).toEqual(expected);
      expect(model.find).toHaveBeenCalled();
    });

    it('should return an array of mapped modules (nl)', async () => {
      const result = [mockModule];

      mockModuleModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      });

      const modules = await service.findAll('nl');
      
      const expected = [{
        _id: mockModule['_id'],
        name: mockModule.name_nl,
        description: mockModule.description_nl,
        studycredit: mockModule.studycredit,
        location: mockModule.location
      }];

      expect(modules).toEqual(expected);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a mapped module if found (default en)', async () => {
      console.log('Test: ModulesService.findOne - Start');
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModule),
      });

      const foundModule = await service.findOne('someId');
      console.log('Test: ModulesService.findOne - Result:', foundModule);
      
      const expected = {
        _id: mockModule['_id'],
        name: mockModule.name_en,
        description: mockModule.description_en,
        studycredit: mockModule.studycredit,
        location: mockModule.location,
        level: mockModule.level,
        available_spots: mockModule.available_spots,
        start_date: mockModule.start_date,
        module_tags: mockModule.module_tags_en,
      };

      expect(foundModule).toEqual(expected);
      expect(model.findById).toHaveBeenCalledWith('someId');
    });

    it('should return a mapped module if found (nl)', async () => {
      mockModuleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModule),
      });

      const foundModule = await service.findOne('someId', 'nl');
      
      const expected = {
        _id: mockModule['_id'],
        name: mockModule.name_nl,
        description: mockModule.description_nl,
        studycredit: mockModule.studycredit,
        location: mockModule.location,
        level: mockModule.level,
        available_spots: mockModule.available_spots,
        start_date: mockModule.start_date,
        module_tags: mockModule.module_tags_nl,
      };

      expect(foundModule).toEqual(expected);
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
