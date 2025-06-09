import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { OrderStatusEnum } from '../order/types';

/**
 * Enhanced validators that use the branded type guards
 */

export function IsBrandedPrice(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBrandedPrice',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'number' && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive number for Price type`;
        },
      },
    });
  };
}

export function IsBrandedSKU(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBrandedSKU',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'string' && /^[A-Z]{2,3}-\d{4,6}$/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in format XX-XXXX or XXX-XXXXXX (e.g., AB-1234, ABC-123456) for SKU type`;
        },
      },
    });
  };
}

export function IsBrandedOrderStatus(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBrandedOrderStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'string' &&
            Object.values(OrderStatusEnum).includes(value as OrderStatusEnum)
          );
        },
        defaultMessage(args: ValidationArguments) {
          const validValues = Object.values(OrderStatusEnum).join(', ');
          return `${args.property} must be one of: ${validValues} for OrderStatus type`;
        },
      },
    });
  };
}

/**
 * Generic branded type validator factory
 */
export function IsBrandedType<T>(
  typeGuard: (value: unknown) => value is T,
  typeName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: `is${typeName}`,
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeGuard(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ${typeName}`;
        },
      },
    });
  };
}
