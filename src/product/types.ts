import { Brand } from 'src/types/brand-utils';
import {
  PRODUCT_ID_BRAND,
  PRICE_BRAND,
  PRODUCT_NAME_BRAND,
  PRODUCT_DESCRIPTION_BRAND,
  SKU_BRAND,
  CATEGORY_ID_BRAND,
  STOCK_QUANTITY_BRAND,
} from './brands';

export type ProductId = Brand<number, typeof PRODUCT_ID_BRAND>;
export type Price = Brand<number, typeof PRICE_BRAND>;
export type ProductName = Brand<string, typeof PRODUCT_NAME_BRAND>;
export type ProductDescription = Brand<
  string | null,
  typeof PRODUCT_DESCRIPTION_BRAND
>;
export type SKU = Brand<string, typeof SKU_BRAND>;
export type CategoryId = Brand<number, typeof CATEGORY_ID_BRAND>;
export type StockQuantity = Brand<number, typeof STOCK_QUANTITY_BRAND>;
