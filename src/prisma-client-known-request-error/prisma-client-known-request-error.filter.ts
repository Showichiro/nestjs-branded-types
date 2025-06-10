import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, _host: ArgumentsHost) {
    // _host is part of the interface, even if not explicitly used in this filter
    // when simply re-throwing NestJS HttpExceptions.
    // The following line is to satisfy the linter for an unused parameter.
    const __host = _host; // Assign to another unused variable
    if (!__host) {
      /* do nothing, just use __host */
    }

    // Handle P2025: Record not found
    if (exception.code === 'P2025') {
      Logger.log(exception);
      throw new NotFoundException(exception.message);
    }

    const codeStartWith = exception.code.at(1);
    // Handle P1xxx errors: Database connection errors, etc.
    if (codeStartWith === '1') {
      Logger.error(exception);
      throw new InternalServerErrorException('予期せぬエラーが発生しました。');
    }
    // Handle other P2xxx errors: Query constraint violations, etc.
    if (codeStartWith === '2') {
      Logger.log(exception);
      throw new BadRequestException(exception.message);
    }

    // For any other PrismaClientKnownRequestError that doesn't match above,
    // rethrow or handle as a generic server error.
    // This case should ideally not be reached if Prisma versions its errors consistently.
    Logger.error(
      `Unhandled Prisma Error Code: ${exception.code}`,
      exception.stack,
    );
    throw new InternalServerErrorException(
      '予期せぬデータベースエラーが発生しました。',
    );
  }
}
