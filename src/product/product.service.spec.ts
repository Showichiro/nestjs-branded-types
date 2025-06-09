import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaProductToDomain } from './product.mapper';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductId, CategoryId, Price, ProductName, ProductDescription, SKU, StockQuantity } from './types';
import { NotFoundException } from '@nestjs/common';
import { Product as ProductInterface } from './interfaces/product.interface'; // Domain Product interface
import { Product as PrismaProductModel } from '@prisma/client'; // Prisma's generated Product type

// Define a type for our mock PrismaService for product operations
type MockPrismaProductDelegate = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type MockPrismaService = {
  product: MockPrismaProductDelegate;
};

const mockPrismaService: MockPrismaService = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Helper to create sample Prisma Product Models for mocking
const createSamplePrismaProduct = (id: number, categoryId: number, name: string): PrismaProductModel => ({
  id,
  name,
  description: `Description for ${name}`,
  price: 100 + id, // decimal for Prisma, but number for JS
  sku: `SKU-${id}`,
  categoryId,
  stockQuantity: 10 + id,
  createdAt: new Date(),
  updatedAt: new Date(),
});


describe('ProductService', () => {
  let service: ProductService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get(PrismaService) as MockPrismaService;

    // Reset mocks before each test
    Object.values(prisma.product).forEach(mockFn => mockFn.mockClear());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of mapped products', async () => {
      const rawProducts = [
        createSamplePrismaProduct(1, 10, 'Product 1'),
        createSamplePrismaProduct(2, 10, 'Product 2'),
      ];
      prisma.product.findMany.mockResolvedValue(rawProducts);

      const expectedProducts = rawProducts.map(mapPrismaProductToDomain);
      const result = await service.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProducts);
    });
  });

  describe('findById', () => {
    const sampleId = 1 as unknown as ProductId;
    const rawProduct = createSamplePrismaProduct(1, 10, 'Product 1');

    it('should return a mapped product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(rawProduct);
      const expectedProduct = mapPrismaProductToDomain(rawProduct);

      const result = await service.findById(sampleId);

      expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: sampleId } });
      expect(result).toEqual(expectedProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      const nonExistentId = 99 as unknown as ProductId;
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(NotFoundException);
      expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: nonExistentId } });
    });
  });

  describe('findByCategory', () => {
    it('should return an array of mapped products for a category', async () => {
      const sampleCategoryId = 10 as unknown as CategoryId;
      const rawProducts = [
        createSamplePrismaProduct(1, 10, 'Product 1'),
        createSamplePrismaProduct(3, 10, 'Product 3'),
      ];
      prisma.product.findMany.mockResolvedValue(rawProducts);
      const expectedProducts = rawProducts.map(mapPrismaProductToDomain);

      const result = await service.findByCategory(sampleCategoryId);

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({ where: { categoryId: sampleCategoryId } });
      expect(result).toEqual(expectedProducts);
    });
  });

  describe('create', () => {
    it('should create a product and return its ID', async () => {
      const dto: CreateProductDto = {
        name: 'New Product' as ProductName,
        description: 'New Desc' as ProductDescription,
        price: 150 as unknown as Price,
        sku: 'NEW-SKU-1' as SKU,
        categoryId: 12 as unknown as CategoryId,
        stockQuantity: 50 as unknown as StockQuantity,
      };
      const createdRawProduct = { ...createSamplePrismaProduct(5, 12, 'New Product'), ...dto };
      // Prisma's create returns the full product object including the ID
      prisma.product.create.mockResolvedValue(createdRawProduct);

      const expectedId = createdRawProduct.id as unknown as ProductId;
      const result = await service.create(dto);

      expect(prisma.product.create).toHaveBeenCalledTimes(1);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expectedId);
    });
  });

  describe('update', () => {
    it('should update a product and return the mapped updated product', async () => {
      const sampleId = 1 as unknown as ProductId;
      const dto: UpdateProductDto = {
        name: 'Updated Product Name' as ProductName,
        price: 125 as unknown as Price,
      };
      const updatedRawProduct = {
        ...createSamplePrismaProduct(1, 10, 'Product 1'),
        name: dto.name as unknown as string, // Apply update
        price: dto.price as unknown as number, // Apply update
        updatedAt: new Date() // Simulate updatedAt change
      };
      prisma.product.update.mockResolvedValue(updatedRawProduct);
      const expectedProduct = mapPrismaProductToDomain(updatedRawProduct);

      const result = await service.update(sampleId, dto);

      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: sampleId as number }, // Service casts to number
        data: dto,
      });
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      const sampleId = 1 as unknown as ProductId;
      prisma.product.delete.mockResolvedValue({}); // Prisma delete returns the deleted object or void/empty on some versions/setups

      await service.delete(sampleId);

      expect(prisma.product.delete).toHaveBeenCalledTimes(1);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: sampleId } });
    });
  });
});
