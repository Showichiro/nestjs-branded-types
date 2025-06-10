import { PrismaClientKnownRequestErrorFilter } from './prisma-client-known-request-error.filter';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  ArgumentsHost,
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

// Mock for HttpArgumentsHost
const mockHttpArgumentsHost = {
  getRequest: jest.fn(),
  getResponse: jest.fn(),
  getNext: jest.fn(),
};

// A more accurate mock for ArgumentsHost
const mockArgumentsHost: ArgumentsHost = {
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost), // switchToHttp returns the mockHttpArgumentsHost
  switchToRpc: jest.fn().mockReturnThis(), // Keep others simple if not used
  switchToWs: jest.fn().mockReturnThis(),
  getType: jest.fn().mockReturnValue('http'),
};

describe('PrismaClientKnownRequestErrorFilter', () => {
  let filter: PrismaClientKnownRequestErrorFilter;

  beforeEach(() => {
    filter = new PrismaClientKnownRequestErrorFilter();

    // Clear all top-level mocks on mockArgumentsHost
    jest.clearAllMocks();

    // Reset implementations or return values for mockArgumentsHost and its nested mocks
    mockArgumentsHost.getArgs = jest.fn();
    mockArgumentsHost.getArgByIndex = jest.fn();
    mockArgumentsHost.switchToHttp = jest
      .fn()
      .mockReturnValue(mockHttpArgumentsHost);
    mockArgumentsHost.switchToRpc = jest.fn().mockReturnThis();
    mockArgumentsHost.switchToWs = jest.fn().mockReturnThis();
    mockArgumentsHost.getType = jest.fn().mockReturnValue('http');

    // Reset mocks on the object returned by switchToHttp()
    mockHttpArgumentsHost.getRequest = jest.fn();
    mockHttpArgumentsHost.getResponse = jest.fn();
    mockHttpArgumentsHost.getNext = jest.fn();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('P2025 Error Handling', () => {
    it('should throw NotFoundException for error code P2025', () => {
      const error = createMockPrismaError('P2025', 'Record not found');
      try {
        filter.catch(error, mockArgumentsHost);
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(NotFoundException);
        const httpException = e as HttpException;
        expect(httpException.message).toBe('Record not found');
        expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
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
        filter.catch(error, mockArgumentsHost);
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(BadRequestException);
        const httpException = e as HttpException;
        expect(httpException.message).toBe(
          "The provided value for the column is too long for the column's type.",
        );
        expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
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
        filter.catch(error, mockArgumentsHost);
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        const httpException = e as HttpException;
        expect(httpException.message).toBe('予期せぬエラーが発生しました。');
        expect(httpException.getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });

  describe('Unhandled Prisma Error Code Handling', () => {
    it('should throw InternalServerErrorException for an unclassified P-error code like P3000', () => {
      const error = createMockPrismaError('P3000', 'Migration error');
      try {
        filter.catch(error, mockArgumentsHost);
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        const httpException = e as HttpException;
        expect(httpException.message).toBe(
          '予期せぬデータベースエラーが発生しました。',
        );
        expect(httpException.getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });

  describe('Non-Prisma Error Handling', () => {
    it('should cause a TypeError if a non-Prisma error is forced (due to missing .code)', () => {
      const genericError = new Error('Some generic error');
      try {
        filter.catch(
          genericError as Prisma.PrismaClientKnownRequestError,
          mockArgumentsHost,
        );
      } catch (e: unknown) {
        expect(e).toBeInstanceOf(TypeError);
        expect(e).not.toBeInstanceOf(HttpException);
      }
    });
  });
});
