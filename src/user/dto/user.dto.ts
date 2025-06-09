import { UserMail, UserName } from '../types';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @IsEmail()
  @IsNotEmpty()
  email: UserMail;
  @IsOptional()
  @IsString()
  name: UserName;
}
