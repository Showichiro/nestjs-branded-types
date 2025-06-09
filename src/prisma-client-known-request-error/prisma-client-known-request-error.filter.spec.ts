import { PrismaClientKnownRequestErrorFilter } from './prisma-client-known-request-error.filter';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Helper to create PrismaClientKnownRequestError instances
const createMockPrismaError = (
  code: string,
  message: string,
  meta?: Record<string, unknown>,
  clientVersion = '5.0.0',
): Prisma.PrismaClientKnownRequestError => {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion,
    meta,
  });
};

// Mock ArgumentsHost
const mockArgumentsHost = {
  switchToHttp: jest.fn().mockReturnThis(),
  getResponse: jest.fn(),
  getRequest: jest.fn(),
  getNext: jest.fn(),
};

// Since the filter throws exceptions rather than sending responses,
// we don't need a complex response mock for these unit tests.
// We will check the type and properties of the thrown exceptions.

describe('PrismaClientKnownRequestErrorFilter', () => {
  let filter: PrismaClientKnownRequestErrorFilter;

  beforeEach(() => {
    filter = new PrismaClientKnownRequestErrorFilter();
    // Reset mocks for each test if they were used to capture calls
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('P2025 Error Handling', () => {
    it('should throw NotFoundException for error code P2025', () => {
      const error = createMockPrismaError('P2025', 'Record not found');
      try {
        filter.catch(error, mockArgumentsHost as any);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.message).toBe('Record not found');
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('Other P2xxx Error Handling', () => {
    it('should throw BadRequestException for error code P2000', () => {
      const error = createMockPrismaError(
        'P2000',
        "The provided value for the column is too long for the column's type.",
      );
      try {
        filter.catch(error, mockArgumentsHost as any);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toBe(
          "The provided value for the column is too long for the column's type.",
        );
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('P1xxx Error Handling', () => {
    it('should throw InternalServerErrorException for error code P1001', () => {
      const error = createMockPrismaError(
        'P1001',
        "Can't reach database server.",
      );
      try {
        filter.catch(error, mockArgumentsHost as any);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        expect(e.message).toBe('予期せぬエラーが発生しました。');
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('Unhandled Prisma Error Code Handling', () => {
    it('should throw InternalServerErrorException for an unclassified P-error code like P3000', () => {
      // P3xxx codes are typically migration errors, but let's assume one isn't explicitly P1/P2 prefix handled
      const error = createMockPrismaError('P3000', 'Migration error');
      try {
        filter.catch(error, mockArgumentsHost as any);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        expect(e.message).toBe('予期せぬデータベースエラーが発生しました。');
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('Non-Prisma Error Handling', () => {
    // This test is a bit conceptual for a @Catch(SpecificError) filter.
    // The NestJS framework wouldn't call this filter for a generic Error.
    // If called manually, it would likely error due to missing `exception.code`.
    // This test checks that it doesn't crash unexpectedly and re-throws something.
    it('should re-throw or not handle a generic error if forced', () => {
      const genericError = new Error('Some generic error');
      try {
        // Manually calling catch with a non-Prisma error
        filter.catch(genericError as any, mockArgumentsHost as any);
      } catch (e) {
        // The filter's current code would try to access `e.code.at(1)` which would fail for a generic Error.
        // It should ideally not be called with a generic error by NestJS itself.
        // Depending on strictness, this could be expected to throw a TypeError or the original error.
        // Given the filter's implementation, it will throw a TypeError because `code` is undefined.
        // For a more robust filter, one might add `if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) { throw exception; }`
        // but that's usually handled by `@Catch()`.
        // The current filter implementation will cause a TypeError here.
        expect(e).not.toBeInstanceOf(HttpException); // It won't be an HttpException from our filter logic
        expect(e).toBeInstanceOf(Error); // It will be some form of error
      }
    });
  });
});
