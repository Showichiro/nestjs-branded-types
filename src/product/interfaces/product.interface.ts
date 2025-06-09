import {
  ProductId,
  Price,
  ProductName,
  ProductDescription,
  SKU,
  CategoryId,
  StockQuantity,
} from '../types';

export interface Product {
  id: ProductId;
  name: ProductName;
  description: ProductDescription;
  price: Price;
  sku: SKU;
  categoryId: CategoryId;
  stockQuantity: StockQuantity;
  createdAt: Date;
  updatedAt: Date;
}
