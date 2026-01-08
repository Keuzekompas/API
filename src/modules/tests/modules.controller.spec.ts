import { Test, TestingModule } from '@nestjs/testing';
import { ModulesController } from '../modules.controller';
import { ModulesService } from '../modules.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { GetModulesQueryDto } from '../dtos/get-modules-query.dto';

describe('ModulesController', () => {
  let modulesController: ModulesController;
  let modulesService: ModulesService;

  const mockModulesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModulesController],
      providers: [
        {
          provide: ModulesService,
          useValue: mockModulesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    modulesController = module.get<ModulesController>(ModulesController);
  });

  describe('findAll', () => {
    it('should pass query params to service and return result', async () => {
      const result = [{ name: 'Module1' }];
      const query: GetModulesQueryDto = { lang: 'en', page: 1, limit: 10 };
      
      mockModulesService.findAll.mockResolvedValue(result);

      const response = await modulesController.findAll(query);

      expect(mockModulesService.findAll).toHaveBeenCalledWith(query);
      expect(response).toEqual({
        status: 200,
        message: 'Modules successfully retrieved',
        data: result,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single module', async () => {
      const result = { name: 'Module1' };
      mockModulesService.findOne.mockResolvedValue(result);

      const validId = '507f1f77bcf86cd799439011';
      const query: GetModulesQueryDto = { lang: 'en' };
      
      const response = await modulesController.findOne(validId, query);

      expect(mockModulesService.findOne).toHaveBeenCalledWith(validId, 'en');
      expect(response).toEqual({
        status: 200,
        message: 'Module successfully retrieved',
        data: result,
      });
    });

    it('should throw BadRequestException for invalid ID', async () => {
        const invalidId = 'invalid-id';
        const query: GetModulesQueryDto = { lang: 'en' };
        
        await expect(modulesController.findOne(invalidId, query)).rejects.toThrow(
          BadRequestException,
        );
      });
  });
});