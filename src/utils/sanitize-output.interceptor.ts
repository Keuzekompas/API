import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as FilterXSS from 'xss';

@Injectable()
export class SanitizeOutputInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger('SanitizeInterceptor');
  private readonly blacklist = ['password', 'passwordConfirm', 'token'];

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const start = Date.now();

    return next.handle().pipe(
      map((data: T) => {
        const result = this.sanitizeData(data) as T;
        return result;
      }),
    );
  }

  // Unknown because it can be anything (object, string, array, etc.)
  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitizedObject: Record<string, unknown> = {};

      const obj = data as Record<string, unknown>;

      for (const key in obj) {
        if (this.blacklist.includes(key)) {
          sanitizedObject[key] = obj[key];
        } else {
          sanitizedObject[key] = this.sanitizeData(obj[key]);
        }
      }
      return sanitizedObject;
    }

    if (typeof data === 'string') {
      return FilterXSS.filterXSS(data);
    }

    return data;
  }
}
