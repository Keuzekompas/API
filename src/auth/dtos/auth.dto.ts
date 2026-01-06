import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email cant be empty' })
  @Matches(/^[a-zA-Z0-9._%+-]+@student\.avans\.nl$/, {
    message: 'Use a valid Avans student email address',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*\d)(?=(.*[!@#$%^&*(),.?":{}|<>]){2,}).*$/, {
    message: 'Password must contain 1 digit and at least 2 special characters',
  })
  password: string;
}
