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
export class SanitizeOutputInterceptor implements NestInterceptor {
  private readonly blacklist = ['password', 'passwordConfirm', 'token'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Let op: any moet later weg
    const start = Date.now();
    return next.handle().pipe(
      map((data) => {
        const result = this.sanitizeData(data);
        Logger.log(`Sanitization duurde: ${Date.now() - start}ms`);
        return result;
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitizedObject = {};
      for (const key in data) {
        if (this.blacklist.includes(key)) {
          sanitizedObject[key] = data[key];
        } else {
          sanitizedObject[key] = this.sanitizeData(data[key]);
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
