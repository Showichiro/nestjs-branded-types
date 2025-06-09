import { Brand } from 'src/types/brand-utils';
import { UserId } from 'src/user/types';
import { ProductId, Price } from 'src/product/types';
import {
  ORDER_ID_BRAND,
  ORDER_STATUS_BRAND,
  TOTAL_AMOUNT_BRAND,
  QUANTITY_BRAND,
} from './brands';

export enum OrderStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export type OrderId = Brand<number, typeof ORDER_ID_BRAND>;
export type OrderStatus = Brand<OrderStatusEnum, typeof ORDER_STATUS_BRAND>;
export type TotalAmount = Brand<Price, typeof TOTAL_AMOUNT_BRAND>;
export type Quantity = Brand<number, typeof QUANTITY_BRAND>;

export interface OrderItem {
  productId: ProductId;
  quantity: Quantity;
  unitPrice: Price;
}

export interface Order {
  id: OrderId;
  userId: UserId;
  status: OrderStatus;
  totalAmount: TotalAmount;
  items: OrderItem[];
  createdAt: Date;
}
