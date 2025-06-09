import { Nullable } from 'src/types/nullable';
import { Brand } from 'src/types/brand-utils';
import { USER_ID_BRAND, USER_EMAIL_BRAND, USER_NAME_BRAND } from './brands';

export type UserId = Brand<number, typeof USER_ID_BRAND>;
export type UserMail = Brand<string, typeof USER_EMAIL_BRAND>;
export type UserName = Brand<Nullable<string>, typeof USER_NAME_BRAND>;
