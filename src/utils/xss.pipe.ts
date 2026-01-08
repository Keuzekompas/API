import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class XssPipe implements PipeTransform {
  // fields to skip during sanitization
  private readonly skipFields = [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
  ];

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom' || !value) {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(value: any): any {
    if (typeof value === 'string') {
      return xss.filterXSS(value);
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.sanitize(v));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitizedObj = {};
      for (const key in value) {
        if (this.skipFields.includes(key)) {
          // Skip sanitization for sensitive fields
          sanitizedObj[key] = value[key];
        } else {
          sanitizedObj[key] = this.sanitize(value[key]);
        }
      }
      return sanitizedObj;
    }

    return value;
  }
}
