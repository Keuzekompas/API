import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Response, Request } from 'express';
import { LoginThrottlerGuard } from '../guards/login-throttler.guard';
import { Verify2faThrottlerGuard } from '../guards/verify-2fa-throttler.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    verifyTwoFactor: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockLoginThrottlerGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LoginThrottlerGuard)
      .useValue(mockLoginThrottlerGuard)
      .overrideGuard(Verify2faThrottlerGuard)
      .useValue(mockLoginThrottlerGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return 2FA requirement and set temp cookie', async () => {
      const authDto = { email: 'test@student.avans.nl', password: 'pw' };
      const loginResult = { requires2FA: true, tempToken: 'temp-token' };
      
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(mockResponse, authDto, '127.0.0.1');

      expect(mockAuthService.login).toHaveBeenCalledWith(authDto.email, authDto.password, '127.0.0.1');
      expect(mockResponse.cookie).toHaveBeenCalledWith('temp_token', 'temp-token', expect.objectContaining({
        httpOnly: true,
        maxAge: 300000, 
      }));
      expect(result).toEqual({ // Check that wrapped response is correct
        status: 200,
        message: '2FA required',
        data: { requires2FA: true },
      });
    });
  });

  describe('verify2FA', () => {
    it('should verify code and set auth token', async () => {
      const verifyDto = { code: '123456' };
      const verifyResult = { token: 'auth-token', user: { id: '1' } };
      
      mockAuthService.verifyTwoFactor.mockResolvedValue(verifyResult);

      const mockRequest = {
        cookies: { 'temp_token': 'temp-token' },
      } as unknown as Request;

      const result = await controller.verify2FA(mockRequest, mockResponse, verifyDto);

      expect(mockAuthService.verifyTwoFactor).toHaveBeenCalledWith('temp-token', '123456');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('temp_token');
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'auth-token', expect.objectContaining({
        httpOnly: true,
      }));
       expect(result).toEqual({ // Check that wrapped response is correct
        status: 200,
        message: 'Login successful',
        data: { user: { id: '1' } },
      });
    });
  });

  describe('logout', () => {
    it('should clear the authentication cookie', () => {
      controller.logout(mockResponse);

      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: false, // Default for non-prod
        sameSite: 'lax',
      };

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', cookieOptions);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('temp_token', cookieOptions);
    });
  });

});

