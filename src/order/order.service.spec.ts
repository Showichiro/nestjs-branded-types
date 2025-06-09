import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaOrderToDomain, calculateTotalAmount as actualCalculateTotalAmount, createCancelledOrderStatus as actualCreateCancelledOrderStatus } from './order.mapper';
import { CreateOrderDto, UpdateOrderStatusDto, OrderItemDto } from './dto/order.dto';
import { OrderId, OrderStatus, OrderStatusEnum, TotalAmount, OrderItem as DomainOrderItem } from './types';
import { UserId } from '../user/types';
import { ProductId, Price } from '../product/types';
import { NotFoundException } from '@nestjs/common';
import { Order as DomainOrder } from './types'; // Domain Order interface from types.ts
import { Order as PrismaOrderModel, OrderItem as PrismaOrderItemModel, Prisma } from '@prisma/client';

// Define the type for Prisma Order with items
type PrismaOrderWithItems = PrismaOrderModel & { items: PrismaOrderItemModel[] };

// Mock the entire mapper module
jest.mock('./order.mapper', () => ({
  ...jest.requireActual('./order.mapper'), // Import and retain other real implementations
  calculateTotalAmount: jest.fn(),
  createCancelledOrderStatus: jest.fn(),
}));

// Define a type for our mock PrismaService for order operations
type MockPrismaOrderDelegate = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  aggregate: jest.Mock;
};

type MockPrismaService = {
  order: MockPrismaOrderDelegate;
};

const mockPrismaService: MockPrismaService = {
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
};

// Helper to create sample Prisma Order Models for mocking
const createSamplePrismaOrder = (
  id: number,
  userIdNum: number,
  status: OrderStatusEnum,
  total: number,
  itemCount = 1
): PrismaOrderWithItems => {
  const items: PrismaOrderItemModel[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({
      id: 100 * id + i, // Unique item ID
      orderId: id,
      productId: i + 1, // Sample product ID
      quantity: 1 + i,
      unitPrice: total / itemCount / (1 + i), // Ensure totalAmount is somewhat related
      // createdAt and updatedAt removed based on TS errors in test environment
    });
  }
  return {
    id,
    userId: userIdNum,
    status,
    totalAmount: total,
    createdAt: new Date(), // Prisma Order model does have this
    // updatedAt: new Date(), // This was flagged as an error, remove for now
    items,
  } as PrismaOrderWithItems; // Cast to assert the shape we are providing
};


describe('OrderService', () => {
  let service: OrderService;
  let prisma: MockPrismaService;
  // Typed mocks for the functions from order.mapper
  let mockedCalculateTotalAmount: jest.MockedFunction<typeof actualCalculateTotalAmount>;
  let mockedCreateCancelledOrderStatus: jest.MockedFunction<typeof actualCreateCancelledOrderStatus>;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get(PrismaService) as MockPrismaService;

    // Assign the mocked functions
    mockedCalculateTotalAmount = jest.requireMock('./order.mapper').calculateTotalAmount;
    mockedCreateCancelledOrderStatus = jest.requireMock('./order.mapper').createCancelledOrderStatus;

    // Reset mocks before each test
    Object.values(prisma.order).forEach(mockFn => mockFn.mockClear());
    mockedCalculateTotalAmount.mockClear();
    mockedCreateCancelledOrderStatus.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of mapped orders', async () => {
      const rawOrders = [
        createSamplePrismaOrder(1, 101, OrderStatusEnum.PENDING, 100),
        createSamplePrismaOrder(2, 102, OrderStatusEnum.CONFIRMED, 200),
      ];
      prisma.order.findMany.mockResolvedValue(rawOrders);

      const expectedOrders = rawOrders.map(mapPrismaOrderToDomain);
      const result = await service.findAll();

      expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({ include: { items: true } });
      expect(result).toEqual(expectedOrders);
    });
  });

  describe('findById', () => {
    const sampleOrderId = 1 as unknown as OrderId;
    const rawOrder = createSamplePrismaOrder(1, 101, OrderStatusEnum.PENDING, 100);

    it('should return a mapped order when found', async () => {
      prisma.order.findUnique.mockResolvedValue(rawOrder);
      const expectedOrder = mapPrismaOrderToDomain(rawOrder);

      const result = await service.findById(sampleOrderId);

      expect(prisma.order.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({ where: { id: sampleOrderId }, include: { items: true } });
      expect(result).toEqual(expectedOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      const nonExistentId = 99 as unknown as OrderId;
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(NotFoundException);
      expect(prisma.order.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({ where: { id: nonExistentId }, include: { items: true } });
    });
  });

  describe('findByUserId', () => {
    it('should return an array of mapped orders for a user', async () => {
      const sampleUserId = 101 as unknown as UserId;
      const rawOrders = [
        createSamplePrismaOrder(1, 101, OrderStatusEnum.PENDING, 100),
        createSamplePrismaOrder(3, 101, OrderStatusEnum.SHIPPED, 150),
      ];
      prisma.order.findMany.mockResolvedValue(rawOrders);
      const expectedOrders = rawOrders.map(mapPrismaOrderToDomain);

      const result = await service.findByUserId(sampleUserId);

      expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({ where: { userId: sampleUserId }, include: { items: true } });
      expect(result).toEqual(expectedOrders);
    });
  });

  describe('create', () => {
    it('should create an order and return its ID', async () => {
      const sampleUserId = 101 as unknown as UserId;
      const dtoItems: OrderItemDto[] = [
        { productId: 1 as unknown as ProductId, quantity: 2 as any, unitPrice: 50 as unknown as Price },
        { productId: 2 as unknown as ProductId, quantity: 1 as any, unitPrice: 100 as unknown as Price },
      ];
      const dto: CreateOrderDto = { userId: sampleUserId, items: dtoItems };

      const mockTotalAmount = 200 as unknown as TotalAmount;
      mockedCalculateTotalAmount.mockReturnValue(mockTotalAmount);

      const createdPrismaOrder = createSamplePrismaOrder(1, sampleUserId as unknown as number, OrderStatusEnum.PENDING, mockTotalAmount as unknown as number, dto.items.length);
      // Ensure items in createdPrismaOrder match dto.items structure for mapping if needed, though service.create only returns ID.
      // For simplicity, we assume createSamplePrismaOrder structure is fine as only ID is returned.
      prisma.order.create.mockResolvedValue(createdPrismaOrder);

      const expectedOrderId = createdPrismaOrder.id as unknown as OrderId;
      const result = await service.create(dto);

      expect(mockedCalculateTotalAmount).toHaveBeenCalledTimes(1);
      // The DTO items are DomainOrderItems, calculateTotalAmount expects DomainOrderItems
      const expectedDomainItems: DomainOrderItem[] = dto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      expect(mockedCalculateTotalAmount).toHaveBeenCalledWith(expectedDomainItems);

      expect(prisma.order.create).toHaveBeenCalledTimes(1);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          status: OrderStatusEnum.PENDING,
          totalAmount: mockTotalAmount,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });
      expect(result).toEqual(expectedOrderId);
    });
  });

  describe('updateStatus', () => {
    it('should update an order status and return the mapped updated order', async () => {
      const sampleOrderId = 1 as unknown as OrderId;
      const dto: UpdateOrderStatusDto = { status: OrderStatusEnum.CONFIRMED as unknown as OrderStatus };

      const updatedRawOrder = createSamplePrismaOrder(1, 101, OrderStatusEnum.CONFIRMED, 100);
      prisma.order.update.mockResolvedValue(updatedRawOrder);
      const expectedOrder = mapPrismaOrderToDomain(updatedRawOrder);

      const result = await service.updateStatus(sampleOrderId, dto);

      expect(prisma.order.update).toHaveBeenCalledTimes(1);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: sampleOrderId },
        data: { status: dto.status },
        include: { items: true },
      });
      expect(result).toEqual(expectedOrder);
    });
  });

  describe('cancel', () => {
    it('should cancel an order by updating its status', async () => {
      const sampleOrderId = 1 as unknown as OrderId;
      const cancelledStatus = OrderStatusEnum.CANCELLED as unknown as OrderStatus;
      mockedCreateCancelledOrderStatus.mockReturnValue(cancelledStatus);

      // Spy on service.updateStatus for this test
      const updateStatusSpy = jest.spyOn(service, 'updateStatus');
      // Mock the return value of updateStatus to avoid actual prisma call from it
      const cancelledRawOrder = createSamplePrismaOrder(1, 101, OrderStatusEnum.CANCELLED, 100);
      const expectedCancelledOrder = mapPrismaOrderToDomain(cancelledRawOrder);
      updateStatusSpy.mockResolvedValue(expectedCancelledOrder);


      const result = await service.cancel(sampleOrderId);

      expect(mockedCreateCancelledOrderStatus).toHaveBeenCalledTimes(1);
      expect(updateStatusSpy).toHaveBeenCalledTimes(1);
      expect(updateStatusSpy).toHaveBeenCalledWith(sampleOrderId, { status: cancelledStatus });
      expect(result).toEqual(expectedCancelledOrder);

      updateStatusSpy.mockRestore(); // Clean up spy
    });
  });

  describe('calculateTotalByUserId', () => {
    const sampleUserId = 1 as unknown as UserId;

    it('should return the sum of totalAmounts for a user', async () => {
      const mockAggregationResult = { _sum: { totalAmount: 550 } };
      prisma.order.aggregate.mockResolvedValue(mockAggregationResult);

      const result = await service.calculateTotalByUserId(sampleUserId);

      expect(prisma.order.aggregate).toHaveBeenCalledTimes(1);
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          userId: sampleUserId,
          status: { not: OrderStatusEnum.CANCELLED },
        },
        _sum: { totalAmount: true },
      });
      expect(result).toBe(550 as unknown as Price);
    });

    it('should return 0 if the sum of totalAmounts is null', async () => {
      const mockAggregationResult = { _sum: { totalAmount: null } };
      prisma.order.aggregate.mockResolvedValue(mockAggregationResult);

      const result = await service.calculateTotalByUserId(sampleUserId);

      expect(result).toBe(0 as unknown as Price);
    });
  });
});
