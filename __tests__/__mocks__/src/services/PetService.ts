// Create shared mock instance to ensure all instances use the same mocks
const mockInstance = {
  upsertPetFromOnboarding: jest.fn().mockResolvedValue({
    id: 'test-pet-id',
    success: true,
  }),

  getPet: jest.fn().mockResolvedValue({
    id: 'test-pet',
    name: 'Test Pet',
    species: 'dog',
  }),

  updatePet: jest.fn().mockResolvedValue({
    success: true,
  }),

  getPets: jest.fn().mockResolvedValue([]),

  syncOfflineData: jest.fn().mockResolvedValue({
    synced: 0,
    conflicts: 0,
  }),
};

export class PetService {
  upsertPetFromOnboarding = mockInstance.upsertPetFromOnboarding;
  getPet = mockInstance.getPet;
  updatePet = mockInstance.updatePet;
  getPets = mockInstance.getPets;
  syncOfflineData = mockInstance.syncOfflineData;
}

// Export the mock instance for direct access in tests
export const mockPetServiceInstance = mockInstance;

// Make the mock instance available globally for tests
(global as any).__MOCK_PET_SERVICE__ = mockInstance;

export default PetService;
