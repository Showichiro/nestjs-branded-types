import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import {
  Price,
  ProductName,
  ProductDescription,
  SKU,
  CategoryId,
  StockQuantity,
} from '../types';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: ProductName;

  @IsOptional()
  @IsString()
  description: ProductDescription;

  @IsNumber()
  @IsPositive()
  price: Price;

  @IsString()
  @IsNotEmpty()
  sku: SKU;

  @IsNumber()
  @IsPositive()
  categoryId: CategoryId;

  @IsNumber()
  @Min(0)
  stockQuantity: StockQuantity;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: ProductName;

  @IsOptional()
  @IsString()
  description?: ProductDescription;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: Price;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: StockQuantity;
}
