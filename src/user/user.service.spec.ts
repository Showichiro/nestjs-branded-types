import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { UserId, UserMail, UserName } from './types'; // Import branded types
// import { User as UserModelPrisma } from '@prisma/client'; // Prisma's User model type - REMOVED

// Define a simplified User model type based on observed TS errors for tests
// This is a workaround if the full UserModelPrisma is not resolving correctly in tests
type TestUserModel = {
  id: UserId;
  email: string; // Prisma model would have string, not UserMail directly
  name: string | null;
  // createdAt and updatedAt are omitted based on previous TS errors
};

type MockPrismaService = {
  user: {
    findMany: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
  };
};

const mockPrismaService: MockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);

    prisma.user.findMany.mockClear();
    prisma.user.findUniqueOrThrow.mockClear();
    prisma.user.create.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUsers', () => {
    it('should return an array of users', async () => {
      const sampleUsers: TestUserModel[] = [
        // Using simplified TestUserModel
        {
          id: 1 as unknown as UserId,
          email: 'test1@example.com',
          name: 'Test User 1',
        },
        {
          id: 2 as unknown as UserId,
          email: 'test2@example.com',
          name: 'Test User 2',
        },
      ];
      prisma.user.findMany.mockResolvedValue(sampleUsers as any); // Cast as any if return type mismatch

      const result = await service.findUsers();

      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleUsers);
    });
  });

  describe('findById', () => {
    const sampleId = 1 as unknown as UserId;
    const sampleUser: TestUserModel = {
      // Using simplified TestUserModel
      id: sampleId,
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should return a single user when found', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(sampleUser as any); // Cast as any

      const result = await service.findById(sampleId);

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: sampleId },
      });
      expect(result).toEqual(sampleUser);
    });

    it('should throw an error if user not found', async () => {
      const nonExistentId = 99 as unknown as UserId;
      const error = new Error('User not found');
      prisma.user.findUniqueOrThrow.mockRejectedValue(error);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        'User not found',
      );
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const sampleDto: UserDto = {
        email: 'newuser@example.com' as UserMail,
        name: 'New User' as UserName,
      };
      // The createdUser should match the simplified TestUserModel for consistency in this test setup
      const createdUserResponse: TestUserModel = {
        // Using simplified TestUserModel
        id: 3 as unknown as UserId,
        email: sampleDto.email as unknown as string, // DTO email is UserMail, prisma.user.create returns string
        name: sampleDto.name as unknown as string | null, // DTO name is UserName, prisma.user.create returns string | null
      };
      prisma.user.create.mockResolvedValue(createdUserResponse as any); // Cast as any

      const result = await service.createUser(sampleDto);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: sampleDto });
      expect(result).toEqual(createdUserResponse);
    });
  });
});
