import {
  OrderId,
  TotalAmount,
  OrderStatus,
  OrderStatusEnum,
  Order,
  Quantity,
  OrderItem,
} from './types';
import { UserId } from 'src/user/types';
import { Price, ProductId } from 'src/product/types';
import { Prisma } from '@prisma/client';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

const createOrderId = (value: number): OrderId => value as OrderId;

const createUserId = (value: number): UserId => value as UserId;

const createOrderStatus = (value: string): OrderStatus => {
  const validStatuses = Object.values(OrderStatusEnum);
  if (!validStatuses.includes(value as OrderStatusEnum)) {
    throw new Error(`Invalid order status: ${value}`);
  }
  return value as OrderStatus;
};

const createTotalAmount = (value: number): TotalAmount => value as TotalAmount;

const createQuantity = (value: number): Quantity => value as Quantity;

const createProductId = (value: number): ProductId => value as ProductId;

const createPrice = (value: number): Price => value as Price;

const createOrderItem = (item: {
  productId: number;
  quantity: number;
  unitPrice: number;
}): OrderItem => ({
  productId: createProductId(item.productId),
  quantity: createQuantity(item.quantity),
  unitPrice: createPrice(item.unitPrice),
});

export const mapPrismaOrderToDomain = (order: OrderWithItems): Order => ({
  id: createOrderId(order.id),
  userId: createUserId(order.userId),
  status: createOrderStatus(order.status),
  totalAmount: createTotalAmount(order.totalAmount),
  items: order.items.map(createOrderItem),
  createdAt: order.createdAt,
});

export const calculateTotalAmount = (items: OrderItem[]): TotalAmount =>
  createTotalAmount(
    items.reduce(
      (sum, item) =>
        sum + (item.unitPrice as number) * (item.quantity as number),
      0,
    ),
  );

export const createCancelledOrderStatus = (): OrderStatus =>
  createOrderStatus(OrderStatusEnum.CANCELLED);
