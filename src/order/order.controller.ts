import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderId, Order } from './types';
import { UserId } from 'src/user/types';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll(
    @Query('userId', ParseIntPipe) userId?: UserId,
  ): Promise<Order[]> {
    if (userId) {
      return this.orderService.findByUserId(userId);
    }
    return this.orderService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: OrderId): Promise<Order> {
    return this.orderService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const orderId = await this.orderService.create(dto);
    return { id: orderId };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: OrderId,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.orderService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: OrderId): Promise<Order> {
    return this.orderService.cancel(id);
  }

  @Get('users/:userId/total')
  async getUserTotal(@Param('userId', ParseIntPipe) userId: UserId) {
    const total = await this.orderService.calculateTotalByUserId(userId);
    return { userId, totalAmount: total };
  }
}
