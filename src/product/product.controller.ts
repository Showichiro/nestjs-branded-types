import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductId, CategoryId } from './types';
import { Product } from './interfaces/product.interface';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('categoryId') categoryId?: CategoryId,
  ): Promise<Product[]> {
    if (categoryId) {
      return this.productService.findByCategory(categoryId);
    }
    return this.productService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: ProductId): Promise<Product> {
    return this.productService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const productId = await this.productService.create(dto);
    return { id: productId };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: ProductId,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: ProductId) {
    await this.productService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
