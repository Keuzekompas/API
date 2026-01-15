import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../mail.service';
import * as nodemailer from 'nodemailer';
import { redisInstance } from '../../utils/redis';

// 1. Mock the Redis module
jest.mock('../../utils/redis', () => ({
  redisInstance: {
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// 2. Mock Nodemailer
jest.mock('nodemailer');
const mockSendMail = jest.fn();

// Ensure createTransport returns an object with our mockSendMail function
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
});

describe('MailService', () => {
  let service: MailService;
  // Backup of the original env vars
  const env = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...env }; // Reset env vars for each test

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterAll(() => {
    process.env = env; // Restore original env vars after all tests
  });

  describe('sendTwoFactorCode', () => {
    it('should return early if cooldown is active (Redis returns null)', async () => {
      // Redis set return null of iets anders dan 'OK' als de key al bestaat (NX optie)
      (redisInstance.set as jest.Mock).mockResolvedValue(null);

      await service.sendTwoFactorCode('test@student.avans.nl', '123456');

      expect(redisInstance.set).toHaveBeenCalledWith(
        'mail_cooldown:test@student.avans.nl',
        'true',
        'EX',
        10,
        'NX',
      );
      // Mail should NOT be sent
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should log to console and NOT send mail if in dev mode (smtp.example.com)', async () => {
      // Arrange
      process.env.MAIL_HOST = 'smtp.example.com';
      (redisInstance.set as jest.Mock).mockResolvedValue('OK');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(); // Mock console.log

      // Act
      await service.sendTwoFactorCode('test@student.avans.nl', '123456');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Mock Mail] To: test@student.avans.nl, Code: 123456',
      );
      expect(mockSendMail).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should send an email via nodemailer if environment is configured correctly', async () => {
      // Arrange
      process.env.MAIL_HOST = 'smtp.real-provider.com';
      process.env.MAIL_FROM = 'noreply@avans.nl';
      (redisInstance.set as jest.Mock).mockResolvedValue('OK');

      // Act
      await service.sendTwoFactorCode('test@student.avans.nl', '123456');

      // Assert
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@avans.nl',
          to: 'test@student.avans.nl',
          subject: 'KeuzeKompas Verification Code',
          // Check if the code is actually present in the HTML
          html: expect.stringContaining('123456'),
        }),
      );
    });

    it('should delete the redis cooldown key if sending mail fails', async () => {
      // Arrange
      process.env.MAIL_HOST = 'smtp.real-provider.com';
      (redisInstance.set as jest.Mock).mockResolvedValue('OK');

      // Simuleer een error bij de mail provider (bv. server down)
      const error = new Error('SMTP Connection Failed');
      mockSendMail.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendTwoFactorCode('test@student.avans.nl', '123456'),
      ).rejects.toThrow('SMTP Connection Failed');

      // Check if the cooldown is removed, so the user can try again
      expect(redisInstance.del).toHaveBeenCalledWith(
        'mail_cooldown:test@student.avans.nl',
      );
    });
  });
});
