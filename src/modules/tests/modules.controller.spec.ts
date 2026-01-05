import { ModulesController } from '../modules.controller';
import { ModulesService } from '../modules.service';
import { NotFoundException } from '@nestjs/common';

describe('ModulesController', () => {
  let modulesController: ModulesController;
  let modulesService: ModulesService;

  beforeEach(() => {
    const mockModuleModel = {};
    modulesService = new ModulesService(mockModuleModel as any);
    modulesController = new ModulesController(modulesService);
  });

  describe('findAll', () => {
    it('should return an array of modules', async () => {
      console.log('Test: ModulesController.findAll - Start');
      const result = [{ name: 'Module1' }, { name: 'Module2' }];
      jest.spyOn(modulesService, 'findAll').mockResolvedValue(result as any);

      const response = await modulesController.findAll();
      console.log('Test: ModulesController.findAll - Response:', response);
      expect(response).toEqual({
        status: 200,
        message: 'Modules successfully retrieved',
        data: result,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single module', async () => {
      console.log('Test: ModulesController.findOne - Start');
      const result = { name: 'Module1' };
      jest.spyOn(modulesService, 'findOne').mockResolvedValue(result as any);

      const response = await modulesController.findOne('1');
      console.log('Test: ModulesController.findOne - Response:', response);
      expect(response).toEqual({
        status: 200,
        message: 'Module successfully retrieved',
        data: result,
      });
    });

    it('should throw NotFoundException with status 404 if module not found', async () => {
      console.log('Test: ModulesController.findOne (Error) - Start');
      jest
        .spyOn(modulesService, 'findOne')
        .mockRejectedValue(new NotFoundException('Module not found'));

      try {
        await modulesController.findOne('1');
      } catch (error) {
        console.log(
          'Test: ModulesController.findOne (Error) - Caught Error:',
          error.message,
        );
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toBe(404);
      }
    });
  });
});
