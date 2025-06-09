import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { UserId } from './types';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findUsers() {
    return this.prisma.user.findMany();
  }

  findById(id: UserId) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  createUser(dto: UserDto) {
    return this.prisma.user.create({ data: dto });
  }
}
