import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Module {
  name_en: string;
  description_en: string;
  studycredit: number;
  location: string;
  level: string;
  module_tags_en: [string];
  start_date: Date;
  available_spots: number;
  name_nl: string;
  description_nl: string;
  module_tags_nl: [string];
}

export type SchemaDocument = HydratedDocument<Module>;
export const ModuleSchema = SchemaFactory.createForClass(Module);
