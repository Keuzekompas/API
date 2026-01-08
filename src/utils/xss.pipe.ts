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

  // Sanitize input values
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom' || !value) {
      // Skip custom types and falsy values
      return value;
    }

    return this.sanitize(value); // Recursively sanitize the input
  }

  private sanitize(value: any): any {
    if (typeof value === 'string') {
      // Sanitize strings
      return xss.filterXSS(value);
    }

    if (Array.isArray(value)) {
      // Sanitize each item in arrays
      return value.map((v) => this.sanitize(v));
    }

    // Sanitize each property in objects
    if (typeof value === 'object' && value !== null) {
      const sanitizedObj = {};
      for (const key in value) {
        if (this.skipFields.includes(key)) {
          // Skip sanitization for sensitive fields
          sanitizedObj[key] = value[key];
        } else {
          // Recursively sanitize other fields
          sanitizedObj[key] = this.sanitize(value[key]);
        }
      }
      return sanitizedObj;
    }

    return value;
  }
}
