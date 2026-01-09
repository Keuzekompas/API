import { Document } from 'mongoose';

export interface Module extends Document {
  readonly name_en: string;
  readonly description_en: string;
  readonly studycredit: number;
  readonly location: string;
  readonly level: string;
  readonly module_tags_en: string[];
  readonly start_date: Date;
  readonly name_nl: string;
  readonly description_nl: string;
  readonly module_tags_nl: string[];
}
