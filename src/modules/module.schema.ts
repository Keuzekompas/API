import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SchemaDocument = HydratedDocument<Module>;

@Schema()
export class Module {
  @Prop()
  name_en: string;

  @Prop()
  description_en: string;

  @Prop()
  studycredit: number;

  @Prop()
  location: string;

  @Prop()
  level: string;

  @Prop([String])
  module_tags_en: string[];

  @Prop()
  start_date: Date;

  @Prop()
  name_nl: string;

  @Prop()
  description_nl: string;

  @Prop([String])
  module_tags_nl: string[];
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
