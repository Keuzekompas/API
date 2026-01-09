export interface ModuleListDto {
  _id: string;
  name: string;
  description: string;
  studycredit: number;
  location: string;
}

export interface ModuleDetailDto {
  _id: string;
  name: string;
  description: string;
  studycredit: number;
  location: string;
  level: string;
  start_date: Date;
  module_tags: string[];
}
