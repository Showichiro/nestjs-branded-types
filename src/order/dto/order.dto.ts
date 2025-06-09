import { IsArray, IsNumber, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserId } from 'src/user/types';
import { ProductId, Price } from 'src/product/types';
import { OrderStatus, Quantity } from '../types';
import { IsPositivePrice } from 'src/validation/custom-validators';
import { IsBrandedOrderStatus } from 'src/validation/branded-validators';

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  productId: ProductId;

  @IsNumber()
  @IsPositive()
  quantity: Quantity;

  @IsPositivePrice()
  unitPrice: Price;
}

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  userId: UserId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsBrandedOrderStatus()
  status: OrderStatus;
}
