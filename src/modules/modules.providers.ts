import { Connection } from 'mongoose';
import { ModuleSchema } from './module.schema';

export const modulesProviders = [
  {
    provide: 'MODULE_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Modules', ModuleSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
