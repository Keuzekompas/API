import { Connection } from 'mongoose';
import { UserSchema } from './user.schema';
import { AuthGuard } from 'src/auth/auth.guard';

export const userProviders = [
  {
    provide: 'USER_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('User', UserSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
