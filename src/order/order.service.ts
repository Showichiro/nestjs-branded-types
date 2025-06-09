import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderId, Order, OrderStatusEnum } from './types';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { UserId } from 'src/user/types';
import { Price } from 'src/product/types';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  mapPrismaOrderToDomain,
  calculateTotalAmount,
  createCancelledOrderStatus,
} from './order.mapper';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      include: {
        items: true,
      },
    });

    return orders.map(mapPrismaOrderToDomain);
  }

  async findById(id: OrderId): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return mapPrismaOrderToDomain(order);
  }

  async findByUserId(userId: UserId): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
    });

    return orders.map(mapPrismaOrderToDomain);
  }

  async create(dto: CreateOrderDto): Promise<OrderId> {
    const totalAmount = calculateTotalAmount(dto.items);

    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        status: OrderStatusEnum.PENDING,
        totalAmount: totalAmount,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return order.id as OrderId;
  }

  async updateStatus(id: OrderId, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: true,
      },
    });

    return mapPrismaOrderToDomain(order);
  }

  async cancel(id: OrderId): Promise<Order> {
    return this.updateStatus(id, { status: createCancelledOrderStatus() });
  }

  async calculateTotalByUserId(userId: UserId): Promise<Price> {
    const result = await this.prisma.order.aggregate({
      where: {
        userId: userId,
        status: { not: OrderStatusEnum.CANCELLED },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return (result._sum.totalAmount || 0) as Price;
  }
}
