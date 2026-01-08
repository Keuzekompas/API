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
  private readonly blacklist = ['password', 'passwordConfirm', 'token']; // fields to skip during sanitization

  // Intercept the response before it's sent to the client (from the controller)
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const start = Date.now();

    return next.handle().pipe(
      map((data: T) => {
        const result = this.sanitizeData(data) as T; // Sanitize the response data
        return result;
      }),
    );
  }

  // Unknown because it can be anything (object, string, array, etc.)
  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return data; // Nothing to sanitize

    // If it's an array, sanitize each item (recursively)
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitizedObject: Record<string, unknown> = {};

      // Treat data as a generic object
      const obj = data as Record<string, unknown>;

      for (const key in obj) {
        if (this.blacklist.includes(key)) {
          // Skip blacklisted fields
          sanitizedObject[key] = obj[key];
        } else {
          sanitizedObject[key] = this.sanitizeData(obj[key]);
        }
      }
      return sanitizedObject;
    }

    // If it's a string, sanitize it via XSS filter
    if (typeof data === 'string') {
      return FilterXSS.filterXSS(data);
    }

    return data;
  }
}
