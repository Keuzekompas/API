import { ModuleListDto } from './module-response.dto';

export interface PaginatedModuleListDto {
  modules: ModuleListDto[];
  total: number;
  page: number;
  limit: number;
}
