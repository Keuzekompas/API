/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Matches(/^[a-zA-Z0-9._%+-]+@student\.avans\.nl$/, {
    message: 'Email must be an Avans student email (@student.avans.nl)',
  })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password should not be empty' })
  password: string;
}
