import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { UserId } from './types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  get() {
    return this.userService.findUsers();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: UserId) {
    return this.userService.findById(id);
  }

  @Post()
  post(@Body() dto: UserDto) {
    return this.userService.createUser(dto);
  }
}
