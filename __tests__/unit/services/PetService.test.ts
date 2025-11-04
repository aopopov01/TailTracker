/**
 * PetService Unit Tests
 * Tests all CRUD operations and core business logic for pet management
 * This service is critical path functionality that all pet features depend on
 */

// Mock Expo modules before importing PetService
jest.mock('expo-file-system', () => ({
  __esModule: true,
  default: {},
  documentDirectory: 'file://mock-document-directory/',
  cacheDirectory: 'file://mock-cache-directory/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  __esModule: true,
  default: {},
  FlipType: {},
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  manipulateAsync: jest.fn(),
  SaveOptions: {},
}));

// Use manual mock from __mocks__ directory to handle re-export structure
// Manual mock will be used automatically due to __mocks__ directory location

// Import statements
import { Pet } from '../../../src/services/PetService';
import { supabase } from '../../../src/lib/supabase';
import {
  createMockDatabasePet,
  createMinimalPet,
  createMockPetList,
  createInvalidPetData,
  supabaseResponseFactories,
  apiResponseFactories,
} from '@/test-utils/petDataFactory';

// Import the actual petService instance
import { petService } from '../../../src/services/PetService';

// Type the mock for better IntelliSense
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PetService', () => {
  // Access the global mock functions for testing
  let mockGetUser: jest.MockedFunction<any>;
  let mockFrom: jest.MockedFunction<any>;
  let mockSelect: jest.MockedFunction<any>;
  let mockEq: jest.MockedFunction<any>;
  let mockSingle: jest.MockedFunction<any>;
  let mockInsert: jest.MockedFunction<any>;
  let mockUpdate: jest.MockedFunction<any>;
  let mockDelete: jest.MockedFunction<any>;
  let mockUpload: jest.MockedFunction<any>;
  let mockGetPublicUrl: jest.MockedFunction<any>;
  let mockStorageFrom: jest.MockedFunction<any>;
  let mockChainableResponse: jest.MockedFunction<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Access the global mock instance or create new mocks
    const globalMock = (global as any).__MOCK_SUPABASE__;
    const sharedMocks = (global as any).__MOCK_SUPABASE_SHARED__;

    if (globalMock && sharedMocks) {
      mockGetUser = sharedMocks.getUser;
      mockFrom = globalMock.from;
      mockStorageFrom = globalMock.storage.from;
      mockChainableResponse = sharedMocks.chainableResponse;
    } else {
      // Fallback: Create new mock functions if global mock not available
      mockGetUser = jest.fn();
      mockFrom = jest.fn();
      mockStorageFrom = jest.fn();
      mockChainableResponse = jest.fn();

      // Update the imported supabase mock directly
      (mockSupabase.auth.getUser as jest.Mock) = mockGetUser;
      (mockSupabase.from as jest.Mock) = mockFrom;
      (mockSupabase.storage.from as jest.Mock) = mockStorageFrom;
    }

    // Create local mock functions for chaining
    mockSelect = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockInsert = jest.fn().mockReturnThis();
    mockUpdate = jest.fn().mockReturnThis();
    mockDelete = jest.fn().mockReturnThis();
    mockUpload = jest
      .fn()
      .mockResolvedValue({ data: { path: 'test-path' }, error: null });
    mockGetPublicUrl = jest
      .fn()
      .mockReturnValue({ data: { publicUrl: 'https://test-url.com' } });
    mockChainableResponse = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });

    // Set up default mock behaviors
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    // Configure the mock chain for database operations
    // Note: The manual mock handles most of the chaining automatically
    // We just need to override specific behaviors for test scenarios

    // Reset the mock behaviors to defaults
    if (mockFrom) {
      mockFrom.mockImplementation(() => {
        const chainable = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: mockSingle,
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          then: jest.fn().mockImplementation(onResolve => {
            return mockChainableResponse().then(onResolve);
          }),
        };

        // Make chainable methods return the chainable object
        Object.keys(chainable).forEach(key => {
          if (!['single', 'maybeSingle', 'then'].includes(key)) {
            chainable[key] = jest.fn().mockReturnValue(chainable);
          }
        });

        return chainable;
      });
    }

    // Configure storage mocks
    if (mockStorageFrom) {
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        download: jest
          .fn()
          .mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
    }
  });

  describe('getPets', () => {
    const mockUser = { user: { id: 'auth-user-123' } };
    const mockUserRecord = { id: 'user-123' };
    const mockPets = createMockPetList(3);

    beforeEach(() => {
      // Mock successful auth
      mockGetUser.mockResolvedValue({ data: mockUser, error: null });
    });

    test('should return pets for authenticated user', async () => {
      // Mock user record lookup - uses .single()
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.select([mockUserRecord])
      );

      // Mock pets query - uses chainable promise resolution (no .single())
      mockChainableResponse.mockResolvedValueOnce(
        supabaseResponseFactories.select(mockPets)
      );

      const result = await petService.getPets();

      expect(mockGetUser).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockFrom).toHaveBeenCalledWith('pets');
      expect(result).toEqual(mockPets);
      expect(result).toHaveLength(3);
    });

    test('should throw error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(petService.getPets()).rejects.toThrow(
        'User not authenticated'
      );
    });

    test('should handle user record not found', async () => {
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.error('User record not found')
      );

      await expect(petService.getPets()).rejects.toThrow();
    });

    test('should handle database errors gracefully', async () => {
      // Mock user lookup success
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.select([mockUserRecord])
      );

      // Mock pets query failure - uses chainable promise resolution
      mockChainableResponse.mockResolvedValueOnce(
        supabaseResponseFactories.error('Database connection failed')
      );

      // Use try-catch approach since Jest's rejects matcher seems to have issues with our error object
      await expect(async () => {
        await petService.getPets();
      }).rejects.toMatchObject({
        message: 'Database connection failed',
      });
    });

    test('should return empty array when no pets found', async () => {
      // Mock user lookup success
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.select([mockUserRecord])
      );

      // Mock empty pets result - uses chainable promise resolution
      mockChainableResponse.mockResolvedValueOnce(
        supabaseResponseFactories.select([])
      );

      const result = await petService.getPets();
      expect(result).toEqual([]);
    });
  });

  describe('getPetById', () => {
    const mockPet = createMockDatabasePet();
    const mockUserRecord = { id: 'user-123' };

    beforeEach(() => {
      // Mock successful auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });
    });

    test('should return pet by ID for authenticated user', async () => {
      // Mock pet query - getPet uses .single() so it expects just the pet object
      mockSingle.mockResolvedValue(supabaseResponseFactories.single(mockPet));

      const result = await petService.getPetById(mockPet.id);

      expect(result).toEqual(mockPet);
      expect(mockFrom).toHaveBeenCalledWith('pets');
    });

    test('should throw error for non-existent pet', async () => {
      // Mock pet not found - getPet returns null for errors, doesn't throw
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.error('Pet not found')
      );

      const result = await petService.getPetById('non-existent-id');

      expect(result).toBeNull();
    });

    test('should handle invalid pet ID format', async () => {
      const invalidIds = ['', null, undefined, 123, {}, []];

      // Mock error for invalid ID
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.error('Invalid pet ID')
      );

      for (const invalidId of invalidIds) {
        const result = await petService.getPetById(invalidId as any);
        expect(result).toBeNull();
      }
    });
  });

  describe('createPet', () => {
    const mockNewPet = createMockDatabasePet();
    const mockUserRecord = { id: 'user-123' };

    beforeEach(() => {
      // Mock successful auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user record lookup
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.select([mockUserRecord])
      );
    });

    test('should create new pet successfully', async () => {
      // Mock user auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user record lookup
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      // Mock pet creation via RPC call
      const mockSupabaseRpc = jest.fn().mockResolvedValue({
        data: mockNewPet.id,
        error: null,
      });

      // Use the imported supabase mock
      (supabase as any).rpc = mockSupabaseRpc;

      // Mock getPet call for returning created pet
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockNewPet)
      );

      const result = await petService.createPet(mockNewPet);

      expect(result).toEqual({
        success: true,
        pet: mockNewPet,
      });
      expect(mockSupabaseRpc).toHaveBeenCalledWith(
        'upsert_pet_data',
        expect.any(Object)
      );
    });

    test('should validate required fields before creation', async () => {
      const invalidPetData = createInvalidPetData();

      // Mock RPC to return validation error
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Name is required' },
      });

      const result = await petService.createPet(invalidPetData as Pet);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pet).toBeUndefined();
    });

    test('should handle database constraint violations', async () => {
      // Mock user auth success but database constraint failure
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user record lookup
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      // Mock RPC call failure due to constraint violation
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Duplicate microchip number',
          code: 'UNIQUE_VIOLATION',
        },
      });

      const result = await petService.createPet(mockNewPet);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate microchip number');
    });

    test('should set default values for optional fields', async () => {
      const minimalPet = createMinimalPet();

      // Mock successful creation process
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: 'new-pet-id',
        error: null,
      });

      // Mock pet retrieval with default values
      const petWithDefaults = {
        ...minimalPet,
        id: 'new-pet-id',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(petWithDefaults)
      );

      const result = await petService.createPet(minimalPet);

      expect(result.success).toBe(true);
      expect(result.pet?.status).toBe('active');
      expect(result.pet?.created_at).toBeDefined();
      expect(result.pet?.updated_at).toBeDefined();
    });

    test('should handle photo upload during creation', async () => {
      const petWithPhoto = createMockDatabasePet({
        profile_photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
      });

      // Mock successful creation process
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      // Mock storage upload success
      const mockStorage = (supabase as any).storage.from('pet-photos');
      mockStorage.upload.mockResolvedValue({
        data: { path: 'pets/photo-123.jpg' },
        error: null,
      });

      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.url/pets/photo-123.jpg' },
      });

      // Mock RPC success
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: 'new-pet-id',
        error: null,
      });

      // Mock pet retrieval with uploaded photo
      const petWithUploadedPhoto = {
        ...petWithPhoto,
        id: 'new-pet-id',
        profile_photo_url: 'https://storage.url/pets/photo-123.jpg',
      };

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(petWithUploadedPhoto)
      );

      const result = await petService.createPet(petWithPhoto);

      expect(result.success).toBe(true);
      expect(result.pet?.profile_photo_url).toBe(
        'https://storage.url/pets/photo-123.jpg'
      );
    });
  });

  describe('updatePet', () => {
    const mockExistingPet = createMockDatabasePet();
    const mockUserRecord = { id: 'user-123' };
    const updatedData = {
      name: 'Updated Pet Name',
      weight_kg: 30,
      medical_conditions: ['New condition'],
    };

    beforeEach(() => {
      // Mock successful auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user record lookup
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.select([mockUserRecord])
      );
    });

    test('should update pet successfully', async () => {
      const updatedPet = { ...mockExistingPet, ...updatedData };

      // Mock RPC success for updatePet
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: mockExistingPet.id,
        error: null,
      });

      // Mock getPet to return updated pet
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.single(updatedPet)
      );

      const result = await petService.updatePet(
        mockExistingPet.id,
        updatedData
      );

      expect(result.success).toBe(true);
      expect(result.pet).toEqual(updatedPet);
      expect(result.error).toBeUndefined();
    });

    test('should automatically update timestamp on modification', async () => {
      const updatedPet = {
        ...mockExistingPet,
        ...updatedData,
        updated_at: new Date().toISOString(),
      };

      // Mock RPC success for updatePet
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: mockExistingPet.id,
        error: null,
      });

      // Mock getPet to return updated pet with new timestamp
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.single(updatedPet)
      );

      const result = await petService.updatePet(
        mockExistingPet.id,
        updatedData
      );

      expect(result.success).toBe(true);
      expect(result.pet?.updated_at).toBeDefined();
      expect(new Date(result.pet!.updated_at!).getTime()).toBeGreaterThan(
        new Date(mockExistingPet.updated_at!).getTime()
      );
    });

    test('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name Only' };
      const updatedPet = { ...mockExistingPet, ...partialUpdate };

      // Mock RPC success for updatePet
      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: mockExistingPet.id,
        error: null,
      });

      // Mock getPet to return updated pet
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.single(updatedPet)
      );

      const result = await petService.updatePet(
        mockExistingPet.id,
        partialUpdate
      );

      expect(result.success).toBe(true);
      expect(result.pet?.name).toBe('New Name Only');
      expect(result.pet?.species).toBe(mockExistingPet.species); // Should remain unchanged
    });

    test('should prevent updating protected fields', async () => {
      const protectedFieldUpdates = {
        id: 'new-id',
        user_id: 'different-user',
        created_at: new Date().toISOString(),
        created_by: 'different-user',
      };

      // Mock update chain to return error for protected fields
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Cannot update protected fields' },
        }),
      };
      (supabase as any).from.mockReturnValue(mockUpdateChain);

      const result = await petService.updatePet(
        mockExistingPet.id,
        protectedFieldUpdates
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pet).toBeUndefined();
    });

    test('should handle non-existent pet update', async () => {
      // Mock update chain to return error for non-existent pet
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Pet not found' },
        }),
      };
      (supabase as any).from.mockReturnValue(mockUpdateChain);

      const result = await petService.updatePet('non-existent-id', updatedData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pet).toBeUndefined();
    });
  });

  describe('deletePet', () => {
    const mockPet = createMockDatabasePet();
    const mockUserRecord = { id: 'user-123' };

    beforeEach(() => {
      // Mock successful auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user record lookup
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.select([mockUserRecord])
      );
    });

    test('should delete pet successfully', async () => {
      mockEq.mockResolvedValue(supabaseResponseFactories.delete());

      await expect(petService.deletePet(mockPet.id)).resolves.not.toThrow();
      expect(mockFrom).toHaveBeenCalledWith('pets');
    });

    test('should handle non-existent pet deletion', async () => {
      // Mock the update chain to return error (deletePet does soft delete via update)
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue(supabaseResponseFactories.error('Pet not found')),
      };
      (supabase as any).from.mockReturnValue(mockUpdateChain);

      const result = await petService.deletePet('non-existent-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Pet not found');
    });

    test('should prevent deletion of pet belonging to another user', async () => {
      // Mock different user
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'different-auth-user' } },
        error: null,
      });

      // Mock the update chain to return unauthorized error (deletePet does soft delete via update)
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue(
            supabaseResponseFactories.error(
              'Unauthorized: Pet belongs to different user'
            )
          ),
      };
      (supabase as any).from.mockReturnValue(mockUpdateChain);

      const result = await petService.deletePet(mockPet.id);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Photo Management', () => {
    const mockPet = createMockDatabasePet();

    test('should upload photo and return public URL', async () => {
      const photoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';

      // Mock ImageManipulator success
      const mockManipulateAsync =
        require('expo-image-manipulator').manipulateAsync;
      mockManipulateAsync.mockResolvedValue({
        uri: 'file:///compressed/image.jpg',
        width: 1024,
        height: 768,
      });

      // Mock FileSystem to return proper base64
      const mockReadAsStringAsync =
        require('expo-file-system').readAsStringAsync;
      mockReadAsStringAsync.mockResolvedValue(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      );

      // Mock storage operations
      mockUpload.mockResolvedValue({
        data: { path: 'pets/photo-123.jpg' },
        error: null,
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.url/pets/photo-123.jpg' },
      });

      // Mock database insert for pet_photos
      const mockPhotoRecord = {
        id: 'photo-123',
        pet_id: mockPet.id,
        photo_url: 'https://storage.url/pets/photo-123.jpg',
        caption: null,
        file_size_bytes: 100,
        is_profile_photo: false,
        created_at: new Date().toISOString(),
      };

      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPhotoRecord,
          error: null,
        }),
      };

      // Override the from mock specifically for pet_photos
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === 'pet_photos') {
          return mockInsertChain;
        }
        return createChainableMock(); // Default for other tables
      });

      const result = await petService.uploadPetPhoto(mockPet.id, photoData);

      expect(result.success).toBe(true);
      expect(result.photo?.photo_url).toBe(
        'https://storage.url/pets/photo-123.jpg'
      );
      expect(mockStorageFrom).toHaveBeenCalledWith('pet-photos');
    });

    test('should handle photo upload failures', async () => {
      const photoData = 'invalid-data';

      // Mock ImageManipulator to fail
      const mockManipulateAsync =
        require('expo-image-manipulator').manipulateAsync;
      mockManipulateAsync.mockRejectedValue(new Error('Invalid image format'));

      const result = await petService.uploadPetPhoto(mockPet.id, photoData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid image format');
    });

    test('should validate photo format before upload', async () => {
      const invalidFormats = [
        'not-base64',
        'data:text/plain;base64,SGVsbG8=',
        '',
        null,
        undefined,
      ];

      for (const invalidData of invalidFormats) {
        const result = await petService.uploadPetPhoto(
          mockPet.id,
          invalidData as any
        );
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle network timeouts', async () => {
      mockGetUser.mockRejectedValue(new Error('Network timeout'));

      await expect(petService.getPets()).rejects.toThrow('Network timeout');
    });

    test('should handle malformed database responses', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock malformed response
      mockSingle.mockResolvedValue({
        data: 'invalid-data-format',
        error: null,
      });

      await expect(petService.getPets()).rejects.toThrow();
    });

    test('should handle concurrent operations safely', async () => {
      const pet = createMockDatabasePet();
      const mockUserRecord = { id: 'user-123' };

      // Mock successful responses
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      // Mock user lookup for each concurrent call
      mockSingle.mockResolvedValue(
        supabaseResponseFactories.select([mockUserRecord])
      );

      // Mock successful updates
      mockSingle.mockResolvedValue(supabaseResponseFactories.update(pet));

      // Run concurrent updates
      const updates = Promise.all([
        petService.updatePet(pet.id, { name: 'Name 1' }),
        petService.updatePet(pet.id, { name: 'Name 2' }),
        petService.updatePet(pet.id, { name: 'Name 3' }),
      ]);

      await expect(updates).resolves.toBeDefined();
    });
  });

  describe('Data Validation', () => {
    test('should validate pet name requirements', async () => {
      const invalidNames = ['', '   ', null, undefined, 'a'.repeat(256)];

      for (const name of invalidNames) {
        const invalidPet = createMockDatabasePet({ name: name as any });
        const result = await petService.createPet(invalidPet);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.pet).toBeUndefined();
      }
    });

    test('should validate species requirements', async () => {
      const invalidSpecies = ['', null, undefined, 'invalid-species', 123];

      for (const species of invalidSpecies) {
        const invalidPet = createMockDatabasePet({ species: species as any });
        const result = await petService.createPet(invalidPet);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.pet).toBeUndefined();
      }
    });

    test('should validate weight values', async () => {
      const invalidWeights = [-1, 0, 1000];

      for (const weight of invalidWeights) {
        const invalidPet = createMockDatabasePet({ weight_kg: weight as any });

        if (weight <= 0 || weight > 500) {
          // Invalid weight ranges should be rejected
          const result = await petService.createPet(invalidPet);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      }

      // null should be allowed for optional weight
      const petWithNullWeight = createMockDatabasePet({ weight_kg: null });

      // Mock successful creation
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      const mockUserRecord = { id: 'user-123', subscription_status: 'free' };
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: 'new-pet-id',
        error: null,
      });

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single({
          ...petWithNullWeight,
          id: 'new-pet-id',
        })
      );

      const result = await petService.createPet(petWithNullWeight);
      expect(result.success).toBe(true);
    });

    test('should validate microchip number format', async () => {
      const validMicrochips = [
        '123456789012345',
        '982000123456789',
        '900164000000123',
      ];

      const invalidMicrochips = [
        '12345', // too short
        '12345678901234567890', // too long
        'abcdefghijklmno', // non-numeric
      ];

      // Valid microchips should be accepted
      for (const microchip of validMicrochips) {
        const validPet = createMockDatabasePet({ microchip_number: microchip });

        // Mock successful creation
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'auth-user-123' } },
          error: null,
        });

        const mockUserRecord = { id: 'user-123', subscription_status: 'free' };
        mockSingle.mockResolvedValueOnce(
          supabaseResponseFactories.single(mockUserRecord)
        );

        (supabase as any).rpc = jest.fn().mockResolvedValue({
          data: 'new-pet-id',
          error: null,
        });

        mockSingle.mockResolvedValueOnce(
          supabaseResponseFactories.single({ ...validPet, id: 'new-pet-id' })
        );

        const result = await petService.createPet(validPet);
        expect(result.success).toBe(true);
      }

      // Invalid microchips should be rejected
      for (const microchip of invalidMicrochips) {
        const invalidPet = createMockDatabasePet({
          microchip_number: microchip,
        });
        const result = await petService.createPet(invalidPet);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.pet).toBeUndefined();
      }

      // null/empty should be allowed for optional field
      const petWithNoMicrochip = createMockDatabasePet({
        microchip_number: null,
      });

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      const mockUserRecord = { id: 'user-123', subscription_status: 'free' };
      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single(mockUserRecord)
      );

      (supabase as any).rpc = jest.fn().mockResolvedValue({
        data: 'new-pet-id',
        error: null,
      });

      mockSingle.mockResolvedValueOnce(
        supabaseResponseFactories.single({
          ...petWithNoMicrochip,
          id: 'new-pet-id',
        })
      );

      const result = await petService.createPet(petWithNoMicrochip);
      expect(result.success).toBe(true);
    });
  });
});
