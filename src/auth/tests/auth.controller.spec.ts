import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should call authService.login and set a cookie', async () => {
      const authDto = { email: 'test@student.avans.nl', password: 'pw' };
      const loginResult = { token: 'abc-token', user: { id: '1' } };
      
      mockAuthService.login.mockResolvedValue(loginResult);

      await controller.login(mockResponse, authDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(authDto.email, authDto.password);
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'abc-token', expect.objectContaining({
        httpOnly: true,
      }));
    });
  });

  describe('logout', () => {
    it('should clear the authentication cookie', () => {
      controller.logout(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', { path: '/' });
    });
  });

});

