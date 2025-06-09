import {
  ProductId,
  Price,
  ProductName,
  ProductDescription,
  SKU,
  CategoryId,
  StockQuantity,
} from './types';
import { Product } from './interfaces/product.interface';
import { Prisma } from '@prisma/client';

type PrismaProduct = Prisma.ProductGetPayload<Record<string, never>>;

const createProductId = (value: number): ProductId => value as ProductId;

const createPrice = (value: number): Price => value as Price;

const createProductName = (value: string): ProductName => value as ProductName;

const createProductDescription = (value: string | null): ProductDescription =>
  value as ProductDescription;

const createSKU = (value: string): SKU => value as SKU;

const createCategoryId = (value: number): CategoryId => value as CategoryId;

const createStockQuantity = (value: number): StockQuantity =>
  value as StockQuantity;

export const mapPrismaProductToDomain = (product: PrismaProduct): Product => ({
  id: createProductId(product.id),
  name: createProductName(product.name),
  description: createProductDescription(product.description),
  price: createPrice(product.price),
  sku: createSKU(product.sku),
  categoryId: createCategoryId(product.categoryId),
  stockQuantity: createStockQuantity(product.stockQuantity),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const mapDomainProductToPrisma = (
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
) => ({
  id: product.id as number,
  name: product.name as string,
  description: product.description as string | null,
  price: product.price as number,
  sku: product.sku as string,
  categoryId: product.categoryId as number,
  stockQuantity: product.stockQuantity as number,
});
