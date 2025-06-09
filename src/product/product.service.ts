import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductId, CategoryId } from './types';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './interfaces/product.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { mapPrismaProductToDomain } from './product.mapper';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.product.findMany();
    return products.map(mapPrismaProductToDomain);
  }

  async findById(id: ProductId): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return mapPrismaProductToDomain(product);
  }

  async findByCategory(categoryId: CategoryId): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { categoryId },
    });
    return products.map(mapPrismaProductToDomain);
  }

  async create(dto: CreateProductDto): Promise<ProductId> {
    const product = await this.prisma.product.create({
      data: dto,
    });

    return product.id as ProductId;
  }

  async update(id: ProductId, dto: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id: id as number },
      data: dto,
    });

    return mapPrismaProductToDomain(product);
  }

  async delete(id: ProductId): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
