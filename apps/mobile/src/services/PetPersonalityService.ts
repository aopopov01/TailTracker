/**
 * Pet Personality Service
 * Provides species-specific personality traits, activities, and care preferences
 */

export interface PersonalityTrait {
  id: string;
  label: string;
  description: string;
  category: 'social' | 'behavior' | 'temperament' | 'energy';
}

export interface FavoriteActivity {
  id: string;
  label: string;
  description: string;
  species?: string[];
}

export interface CareOption {
  id: string;
  label: string;
  description: string;
  category: 'exercise' | 'grooming' | 'diet' | 'environment';
}

export interface ExerciseNeed {
  id: string;
  label: string;
  value: 'low' | 'moderate' | 'high';
  description: string;
}

export interface PersonalityProfile {
  species: string;
  personalityTraits: PersonalityTrait[];
  favoriteActivities: FavoriteActivity[];
  careOptions: CareOption[];
  exerciseNeeds: ExerciseNeed[];
}

// All personality traits available across species
const ALL_PERSONALITY_TRAITS: PersonalityTrait[] = [
  // Social traits
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Good with people',
    category: 'social',
  },
  {
    id: 'outgoing',
    label: 'Outgoing',
    description: 'Enjoys social interaction',
    category: 'social',
  },
  {
    id: 'shy',
    label: 'Shy',
    description: 'Reserved around strangers',
    category: 'social',
  },
  {
    id: 'independent',
    label: 'Independent',
    description: 'Comfortable alone',
    category: 'social',
  },

  // Behavior traits
  {
    id: 'playful',
    label: 'Playful',
    description: 'Loves games and toys',
    category: 'behavior',
  },
  {
    id: 'curious',
    label: 'Curious',
    description: 'Explores everything',
    category: 'behavior',
  },
  {
    id: 'loyal',
    label: 'Loyal',
    description: 'Devoted to family',
    category: 'behavior',
  },
  {
    id: 'protective',
    label: 'Protective',
    description: 'Watchful and guarding',
    category: 'behavior',
  },

  // Temperament traits
  {
    id: 'calm',
    label: 'Calm',
    description: 'Relaxed and peaceful',
    category: 'temperament',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    description: 'Easily stressed',
    category: 'temperament',
  },
  {
    id: 'confident',
    label: 'Confident',
    description: 'Self-assured',
    category: 'temperament',
  },
  {
    id: 'gentle',
    label: 'Gentle',
    description: 'Soft and careful',
    category: 'temperament',
  },

  // Energy traits
  {
    id: 'energetic',
    label: 'Energetic',
    description: 'High activity level',
    category: 'energy',
  },
  {
    id: 'lazy',
    label: 'Lazy',
    description: 'Prefers resting',
    category: 'energy',
  },
  {
    id: 'athletic',
    label: 'Athletic',
    description: 'Physically active',
    category: 'energy',
  },
];

// Species-specific favorite activities
const SPECIES_ACTIVITIES: Record<string, FavoriteActivity[]> = {
  dog: [
    {
      id: 'fetch',
      label: 'Playing Fetch',
      description: 'Retrieving thrown objects',
      species: ['dog'],
    },
    {
      id: 'walks',
      label: 'Long Walks',
      description: 'Extended outdoor exercise',
      species: ['dog'],
    },
    {
      id: 'parks',
      label: 'Dog Parks',
      description: 'Socializing with other dogs',
      species: ['dog'],
    },
    {
      id: 'swimming',
      label: 'Swimming',
      description: 'Water-based exercise',
      species: ['dog'],
    },
    {
      id: 'running',
      label: 'Running',
      description: 'High-speed exercise',
      species: ['dog'],
    },
    {
      id: 'agility',
      label: 'Agility Training',
      description: 'Obstacle courses',
      species: ['dog'],
    },
  ],
  cat: [
    {
      id: 'laser',
      label: 'Laser Pointer',
      description: 'Chasing light',
      species: ['cat'],
    },
    {
      id: 'birds',
      label: 'Window Bird Watching',
      description: 'Observing wildlife',
      species: ['cat'],
    },
    {
      id: 'catnip',
      label: 'Catnip Toys',
      description: 'Interactive play',
      species: ['cat'],
    },
    {
      id: 'climbing',
      label: 'Climbing',
      description: 'Vertical exploration',
      species: ['cat'],
    },
    {
      id: 'hunting',
      label: 'Hunting Toys',
      description: 'Stalking and pouncing',
      species: ['cat'],
    },
    {
      id: 'boxes',
      label: 'Box Exploration',
      description: 'Investigating containers',
      species: ['cat'],
    },
  ],
  bird: [
    {
      id: 'foraging',
      label: 'Foraging Games',
      description: 'Finding hidden treats',
      species: ['bird'],
    },
    {
      id: 'talking',
      label: 'Talking/Mimicking',
      description: 'Vocal interaction',
      species: ['bird'],
    },
    {
      id: 'swinging',
      label: 'Perch Swinging',
      description: 'Balance activities',
      species: ['bird'],
    },
    {
      id: 'flying',
      label: 'Flying Time',
      description: 'Free flight exercise',
      species: ['bird'],
    },
    {
      id: 'puzzles',
      label: 'Puzzle Toys',
      description: 'Mental stimulation',
      species: ['bird'],
    },
  ],
  rabbit: [
    {
      id: 'tunnels',
      label: 'Tunnel Exploration',
      description: 'Burrowing play',
      species: ['rabbit'],
    },
    {
      id: 'hopping',
      label: 'Hopping Exercises',
      description: 'Active movement',
      species: ['rabbit'],
    },
    {
      id: 'chewing',
      label: 'Chew Toys',
      description: 'Dental health play',
      species: ['rabbit'],
    },
    {
      id: 'digging',
      label: 'Digging Box',
      description: 'Natural behaviors',
      species: ['rabbit'],
    },
  ],
  fish: [
    {
      id: 'feeding',
      label: 'Feeding Time',
      description: 'Interactive feeding',
      species: ['fish'],
    },
    {
      id: 'exploring',
      label: 'Tank Exploration',
      description: 'Investigating decorations',
      species: ['fish'],
    },
    {
      id: 'schooling',
      label: 'Schooling',
      description: 'Group swimming',
      species: ['fish'],
    },
  ],
  reptile: [
    {
      id: 'basking',
      label: 'Basking',
      description: 'Heat lamp time',
      species: ['reptile'],
    },
    {
      id: 'hiding',
      label: 'Hide Exploration',
      description: 'Using hideouts',
      species: ['reptile'],
    },
    {
      id: 'climbing',
      label: 'Climbing',
      description: 'Vertical movement',
      species: ['reptile'],
    },
    {
      id: 'hunting',
      label: 'Live Feeding',
      description: 'Natural hunting',
      species: ['reptile'],
    },
  ],
};

// Exercise needs options
const EXERCISE_OPTIONS: ExerciseNeed[] = [
  {
    id: 'high',
    label: 'High Energy',
    value: 'high',
    description: '2+ hours daily exercise needed',
  },
  {
    id: 'moderate',
    label: 'Moderate Energy',
    value: 'moderate',
    description: '1-2 hours daily exercise needed',
  },
  {
    id: 'low',
    label: 'Low Energy',
    value: 'low',
    description: '30-60 minutes daily exercise needed',
  },
];

// Care options
const CARE_OPTIONS: CareOption[] = [
  // Exercise
  {
    id: 'daily-walk',
    label: 'Daily Walks',
    description: 'Regular walking routine',
    category: 'exercise',
  },
  {
    id: 'play-time',
    label: 'Play Sessions',
    description: 'Interactive play',
    category: 'exercise',
  },
  {
    id: 'outdoor-time',
    label: 'Outdoor Time',
    description: 'Fresh air and exploration',
    category: 'exercise',
  },

  // Grooming
  {
    id: 'brushing',
    label: 'Regular Brushing',
    description: 'Coat maintenance',
    category: 'grooming',
  },
  {
    id: 'bathing',
    label: 'Bathing',
    description: 'Cleaning routine',
    category: 'grooming',
  },
  {
    id: 'nail-trim',
    label: 'Nail Trimming',
    description: 'Claw care',
    category: 'grooming',
  },

  // Diet
  {
    id: 'scheduled-feeding',
    label: 'Scheduled Feeding',
    description: 'Regular meal times',
    category: 'diet',
  },
  {
    id: 'treats',
    label: 'Training Treats',
    description: 'Reward-based feeding',
    category: 'diet',
  },
  {
    id: 'special-diet',
    label: 'Special Diet',
    description: 'Dietary requirements',
    category: 'diet',
  },

  // Environment
  {
    id: 'quiet-space',
    label: 'Quiet Space',
    description: 'Calm environment',
    category: 'environment',
  },
  {
    id: 'toys',
    label: 'Enrichment Toys',
    description: 'Mental stimulation',
    category: 'environment',
  },
  {
    id: 'companionship',
    label: 'Companionship',
    description: 'Social interaction',
    category: 'environment',
  },
];

export const PetPersonalityService = {
  /**
   * Get all personality traits across all species
   */
  getAllPersonalityTraits(): PersonalityTrait[] {
    return ALL_PERSONALITY_TRAITS;
  },

  /**
   * Get personality traits suitable for a specific species
   */
  getPersonalityTraitsForSpecies(species: string): PersonalityTrait[] {
    // All traits are available for all species
    return ALL_PERSONALITY_TRAITS;
  },

  /**
   * Get all favorite activities for a specific species
   */
  getAllFavoriteActivities(species: string): FavoriteActivity[] {
    const normalizedSpecies = species.toLowerCase();
    return SPECIES_ACTIVITIES[normalizedSpecies] || [];
  },

  /**
   * Get favorite activities for a specific species (alias for getAllFavoriteActivities)
   */
  getFavoriteActivitiesForSpecies(species: string): FavoriteActivity[] {
    return this.getAllFavoriteActivities(species);
  },

  /**
   * Get complete personality profile for a species
   */
  getPersonalityProfile(species: string): PersonalityProfile {
    return {
      species,
      personalityTraits: this.getPersonalityTraitsForSpecies(species),
      favoriteActivities: this.getAllFavoriteActivities(species),
      careOptions: CARE_OPTIONS,
      exerciseNeeds: EXERCISE_OPTIONS,
    };
  },

  /**
   * Get exercise need options
   */
  getExerciseOptions(): ExerciseNeed[] {
    return EXERCISE_OPTIONS;
  },

  /**
   * Get care options
   */
  getCareOptions(): CareOption[] {
    return CARE_OPTIONS;
  },

  /**
   * Get care options by category
   */
  getCareOptionsByCategory(category: CareOption['category']): CareOption[] {
    return CARE_OPTIONS.filter(option => option.category === category);
  },
};

export default PetPersonalityService;
