import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Module {
  name_en: String;
  description_en: String;
  studycredit: Number;
  location: String;
  level: String;
  module_tags_en: [String];
  start_date: Date;
  available_spots: Number;
  name_nl: String;
  description_nl: String;
  module_tags_nl: [String];
}

export type SchemaDocument = HydratedDocument<Module>;
export const ModuleSchema = SchemaFactory.createForClass(Module);
