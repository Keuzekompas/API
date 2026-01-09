import { IsEnum, IsOptional } from 'class-validator';

export enum Language {
  NL = 'nl',
  EN = 'en',
}

export class LanguageDto {
  @IsOptional() // Optional, default is 'en'
  @IsEnum(Language, {
    message: 'Language must be "nl" or "en"',
  })
  lang?: string = 'en';
}
