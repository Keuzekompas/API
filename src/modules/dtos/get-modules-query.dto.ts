import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum Language {
  NL = 'nl',
  EN = 'en',
}

export class GetModulesQueryDto {
  @IsOptional()
  @IsEnum(Language, {
    message: 'Language must be "nl" or "en"',
  })
  lang?: string = 'en';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  studycredit?: number;
}