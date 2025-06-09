import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    const codeStartWith = exception.code.at(1);
    if (codeStartWith === '1') {
      Logger.error(exception);
      throw new InternalServerErrorException('予期せぬエラーが発生しました。');
    }
    if (codeStartWith === '2') {
      Logger.log(exception);
      throw new BadRequestException(exception.message);
    }
  }
}
