<<<<<<< HEAD
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
=======
import { Schema, SchemaFactory } from '@nestjs/mongoose';
>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
import { HydratedDocument } from 'mongoose';

@Schema()
export class Module {
<<<<<<< HEAD
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
=======
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
>>>>>>> 100b4043cac0087e7763fe51945248ed8e4c21b0
}

export type SchemaDocument = HydratedDocument<Module>;
export const ModuleSchema = SchemaFactory.createForClass(Module);
