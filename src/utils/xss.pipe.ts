import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class XssPipe implements PipeTransform {
  // Velden die we NOOIT willen filteren (zoals bcrypt wachtwoorden)
  private readonly skipFields = [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
  ];

  transform(value: any, metadata: ArgumentMetadata) {
    // Alleen body, query en params filteren
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
          // Sla dit veld over (belangrijk voor bcrypt!)
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
