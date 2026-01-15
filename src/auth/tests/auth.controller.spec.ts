import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Response, Request } from 'express';
import { LoginThrottlerGuard } from '../guards/login-throttler.guard';
import { Verify2faThrottlerGuard } from '../guards/verify-2fa-throttler.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockResponse: Partial<Response>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      verifyTwoFactor: jest.fn(),
    };

    // Belangrijk: reset de mock functies voor elke test
    mockResponse = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    const mockGuard = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(LoginThrottlerGuard)
      .useValue(mockGuard)
      .overrideGuard(Verify2faThrottlerGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return 2FA requirement and set temp cookie', async () => {
      const authDto = { email: 'test@student.avans.nl', password: 'pw' };
      const loginResult = { requires2FA: true, tempToken: 'temp-token' };
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(
        mockResponse as Response,
        authDto,
        '127.0.0.1',
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'temp_token',
        'temp-token',
        expect.any(Object),
      );
      expect(result.message).toBe('2FA required');
    });

    it('should login directly if 2FA is not required', async () => {
      const authDto = { email: 'test@student.avans.nl', password: 'pw' };
      const loginResult = {
        requires2FA: false,
        token: 'final-token',
        user: { id: 1 },
      };
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(
        mockResponse as Response,
        authDto,
        '127.0.0.1',
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'final-token',
        expect.any(Object),
      );
      expect(result.message).toBe('Login successful');
    });
  });

  describe('verify2FA', () => {
    it('should verify code and set auth token', async () => {
      const verifyDto = { code: '123456' };
      const verifyResult = { token: 'auth-token', user: { id: '1' } };
      mockAuthService.verifyTwoFactor.mockResolvedValue(verifyResult);

      const mockRequest = {
        cookies: { temp_token: 'temp-token' },
      } as unknown as Request;

      const result = await controller.verify2FA(
        mockRequest,
        mockResponse as Response,
        verifyDto,
      );

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('temp_token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'auth-token',
        expect.any(Object),
      );
      expect(result.data.user!.id).toBe('1');
    });

    it('should throw UnauthorizedException if temp_token is missing', async () => {
      const mockRequest = { cookies: {} } as unknown as Request;

      await expect(
        controller.verify2FA(mockRequest, mockResponse as Response, {
          code: '123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear all cookies and return success', () => {
      const result = controller.logout(mockResponse as Response);

      const expectedOptions = expect.objectContaining({ path: '/' });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'token',
        expectedOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'temp_token',
        expectedOptions,
      );
      expect(result.status).toBe(200);
    });
  });
});
