import * as mongoose from 'mongoose';

export const ModuleSchema = new mongoose.Schema({
  name_en: String,
  description_en: String,
  studycredit: Number,
  location: String,
  level: String,
  module_tags_en: [String],
  start_date: Date,
  available_spots: Number,
  name_nl: String,
  description_nl: String,
  module_tags_nl: [String],
});
