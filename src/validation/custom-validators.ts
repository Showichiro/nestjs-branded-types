import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsPositivePrice(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPositivePrice',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'number' && value > 0 && Number.isFinite(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive number`;
        },
      },
    });
  };
}

export function IsValidSKU(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidSKU',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return /^[A-Z]{2,3}-\d{4,6}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in format XX-XXXX or XXX-XXXXXX (e.g., AB-1234, ABC-123456)`;
        },
      },
    });
  };
}

export function IsValidOrderStatus(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidOrderStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const validStatuses = [
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
          ];
          return typeof value === 'string' && validStatuses.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: pending, confirmed, shipped, delivered, cancelled`;
        },
      },
    });
  };
}
