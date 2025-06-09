# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `pnpm i`
- **Database setup**: `pnpm prisma db push`
- **Start development**: `pnpm run start:dev`
- **Build**: `pnpm run build`
- **Lint**: `pnpm run lint` (fixes automatically) or `pnpm run lint:check` (check only)
- **Format**: `pnpm run format` (fixes automatically) or `pnpm run format:check` (check only)
- **Tests**: `pnpm run test` (unit tests), `pnpm run test:e2e` (e2e tests), `pnpm run test:watch` (watch mode)
- **Prisma generate**: `pnpm run generate:prisma`

## Architecture

This is a NestJS application with Prisma ORM using SQLite database, demonstrating branded types pattern for type safety.

### Key Components

- **Branded Types**: The project uses TypeScript branded types to create distinct types for common primitives (UserId, UserMail, UserName) preventing accidental type mixing
- **Global Exception Filter**: `PrismaClientKnownRequestErrorFilter` handles Prisma database errors globally, converting them to appropriate HTTP responses
- **Validation**: Uses `class-validator` with ValidationPipe globally enabled for request validation
- **Database**: SQLite with Prisma ORM, schema defined in `prisma/schema.prisma`

### Type System

The project implements TypeScript branded types following a domain-driven design pattern for enhanced type safety.

#### Branded Types Implementation Rules

**1. Domain-Based Organization**
- Each domain has its own `brands.ts` file defining brand symbols
- Common utilities are centralized in `src/types/brand-utils.ts`
- Never create large centralized brand objects (for bundle size optimization)

**File Structure:**
```
src/
├── types/
│   └── brand-utils.ts          # Common Brand<T, TBrand> utility
├── {domain}/
│   ├── brands.ts              # Domain-specific brand symbols
│   ├── types.ts               # Domain branded type definitions
│   ├── dto/                   # DTOs using branded types
│   ├── interfaces/            # Interfaces using branded types
│   └── {domain}.service.ts    # Services with branded types
```

**2. Brand Symbol Naming Convention**
- Use SCREAMING_SNAKE_CASE with `_BRAND` suffix
- Export individual symbols (not as object properties)
- Example: `export const USER_ID_BRAND = Symbol('UserId');`

**3. Branded Type Definition Pattern**
```typescript
// src/{domain}/brands.ts
export const ENTITY_ID_BRAND = Symbol('EntityId');
export const ENTITY_NAME_BRAND = Symbol('EntityName');

// src/{domain}/types.ts
import { Brand } from 'src/types/brand-utils';
import { ENTITY_ID_BRAND, ENTITY_NAME_BRAND } from './brands';

export type EntityId = Brand<number, typeof ENTITY_ID_BRAND>;
export type EntityName = Brand<string, typeof ENTITY_NAME_BRAND>;
```

**4. Usage in Interfaces and DTOs**
- **ALWAYS** use branded types in domain interfaces
- **ALWAYS** use branded types in DTOs for type safety
- Use appropriate base types (string, number, etc.) with branded overlays

**5. Enum Integration**
- For status/state fields, define enum first, then brand it:
```typescript
export enum OrderStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  // ...
}
export type OrderStatus = Brand<OrderStatusEnum, typeof ORDER_STATUS_BRAND>;
```

**6. Mapper Pattern for Data Conversion**
- Use dedicated mapper functions to convert between Prisma and domain types
- Place type assertions/validations in mappers, not in business logic
- Example: `mapPrismaOrderToDomain(order: PrismaOrder): Order`

**7. Type Safety Best Practices**
- Use branded types consistently across the entire data flow
- Avoid `any` types; use proper type assertions in controlled locations
- Leverage TypeScript's structural typing for branded type compatibility

**Current Domains:**
- **User**: `UserId`, `UserMail`, `UserName`
- **Product**: `ProductId`, `Price`, `ProductName`, `ProductDescription`, `SKU`, `CategoryId`, `StockQuantity`
- **Order**: `OrderId`, `OrderStatus`, `TotalAmount`, `Quantity`

#### Implementation Examples

**Domain Setup:**
```typescript
// src/product/brands.ts
export const PRODUCT_ID_BRAND = Symbol('ProductId');
export const PRICE_BRAND = Symbol('Price');

// src/product/types.ts
import { Brand } from 'src/types/brand-utils';
import { PRODUCT_ID_BRAND, PRICE_BRAND } from './brands';

export type ProductId = Brand<number, typeof PRODUCT_ID_BRAND>;
export type Price = Brand<number, typeof PRICE_BRAND>;

// src/product/interfaces/product.interface.ts
export interface Product {
  id: ProductId;           // NOT: number
  name: ProductName;       // NOT: string
  price: Price;           // NOT: number
  // ...
}

// src/product/dto/product.dto.ts
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: ProductName;       // NOT: string
  
  @IsNumber()
  @IsPositive()
  price: Price;           // NOT: number
  // ...
}
```

**Service Layer:**
```typescript
// src/product/product.service.ts
export class ProductService {
  create(dto: CreateProductDto): ProductId {
    const id = (Math.random() * 1000) as ProductId;  // Type assertion
    // ...
    return id;
  }
  
  findById(id: ProductId): Product { /* ... */ }  // Strong typing
}
```

### Error Handling

Custom Prisma error filter categorizes database errors:
- P1xxx errors (connection/authentication): logged as errors, return 500
- P2xxx errors (query/constraint violations): logged as info, return 400 with message