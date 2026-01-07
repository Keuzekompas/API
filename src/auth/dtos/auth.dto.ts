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
    message: 'Invalid email or password',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Invalid email or password' })
  @Matches(/^(?=.*\d)(?=(.*[!@#$%^&*(),.?":{}|<>]){2,}).*$/, {
    message: 'Invalid email or password',
  })
  password: string;
}
