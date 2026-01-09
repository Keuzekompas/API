import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthDto {
  @Transform(({ value }) => {
    // Only transform if the value is a string, to avoid issues with unexpected types
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  @IsNotEmpty({ message: 'Email cant be empty' })
  @IsString()
  @IsEmail({}, { message: 'Invalid email or password' })
  @Matches(/^[a-zA-Z0-9._%+-]+@student\.avans\.nl$/, {
    message: 'Invalid email or password',
  })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Invalid email or password' })
  @Matches(/^(?=.*\d)(?=(.*[!@#$%^&*(),.?":{}|<>]){2,}).*$/, {
    message: 'Invalid email or password',
  })
  password: string;
}
