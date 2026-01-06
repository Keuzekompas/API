import { AuthGuard } from '../auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';


describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;
    authGuard = new AuthGuard(jwtService);
  });

  const mockContext = (cookies: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          cookies,
        }),
      }),
    } as ExecutionContext);

  it('should allow access if token is valid (Authorization)', async () => {
    const context = mockContext({ token: 'valid.token' });
    const payload = { userId: '123' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const result = await authGuard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.token', expect.any(Object));
  });

  it('should throw UnauthorizedException if no token provided', async () => {
    const context = mockContext({});

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
  });

  it('should throw UnauthorizedException if token is expired (Session Expiration)', async () => {
    const context = mockContext({ token: 'expired.token' });
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('TokenExpiredError'));

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token or expired'),
    );
  });
});