/**
 * Pet Personality and Care Service
 * 
 * Associates personality traits, favorite activities, and care requirements
 * with different animal species to provide relevant options in step 6 of onboarding.
 */

export interface PersonalityTrait {
  id: string;
  label: string;
  description?: string;
  category: 'temperament' | 'behavior' | 'social';
}

export interface CareOption {
  id: string;
  label: string;
  description?: string;
  category: 'exercise' | 'grooming' | 'feeding' | 'environment';
}

export interface FavoriteActivity {
  id: string;
  label: string;
  description?: string;
  category: 'indoor' | 'outdoor' | 'social' | 'training';
}

export interface SpeciesPersonalityProfile {
  species: 'dog' | 'cat' | 'bird' | 'other';
  personalityTraits: PersonalityTrait[];
  careOptions: CareOption[];
  favoriteActivities: FavoriteActivity[];
  exerciseNeeds: Array<{
    id: string;
    label: string;
    value: 'low' | 'moderate' | 'high';
    description: string;
  }>;
}

export class PetPersonalityService {
  private static readonly DOG_PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'loyal', label: 'Loyal', description: 'Devoted to family', category: 'temperament' },
    { id: 'playful', label: 'Playful', description: 'Loves games and fun', category: 'behavior' },
    { id: 'energetic', label: 'Energetic', description: 'High energy level', category: 'behavior' },
    { id: 'friendly', label: 'Friendly', description: 'Good with people', category: 'social' },
    { id: 'protective', label: 'Protective', description: 'Guards family/home', category: 'temperament' },
    { id: 'intelligent', label: 'Intelligent', description: 'Quick learner', category: 'temperament' },
    { id: 'calm', label: 'Calm', description: 'Relaxed and peaceful', category: 'temperament' },
    { id: 'curious', label: 'Curious', description: 'Explores everything', category: 'behavior' },
    { id: 'affectionate', label: 'Affectionate', description: 'Loves cuddles', category: 'social' },
    { id: 'independent', label: 'Independent', description: 'Content alone', category: 'temperament' },
    { id: 'social', label: 'Social', description: 'Loves other dogs', category: 'social' },
    { id: 'gentle', label: 'Gentle', description: 'Good with children', category: 'temperament' }
  ];

  private static readonly DOG_CARE_OPTIONS: CareOption[] = [
    { id: 'daily_walks', label: 'Daily Walks Required', category: 'exercise' },
    { id: 'regular_grooming', label: 'Regular Grooming', category: 'grooming' },
    { id: 'mental_stimulation', label: 'Mental Stimulation Needed', category: 'exercise' },
    { id: 'social_interaction', label: 'Daily Social Interaction', category: 'environment' },
    { id: 'yard_access', label: 'Yard/Outdoor Space', category: 'environment' },
    { id: 'special_diet', label: 'Special Dietary Needs', category: 'feeding' },
    { id: 'medication_routine', label: 'Daily Medication', category: 'feeding' },
    { id: 'professional_grooming', label: 'Professional Grooming', category: 'grooming' }
  ];

  private static readonly DOG_ACTIVITIES: FavoriteActivity[] = [
    { id: 'fetch', label: 'Playing Fetch', category: 'outdoor' },
    { id: 'walks', label: 'Long Walks', category: 'outdoor' },
    { id: 'running', label: 'Running/Jogging', category: 'outdoor' },
    { id: 'swimming', label: 'Swimming', category: 'outdoor' },
    { id: 'training', label: 'Training Sessions', category: 'training' },
    { id: 'puzzle_toys', label: 'Puzzle Toys', category: 'indoor' },
    { id: 'tug_of_war', label: 'Tug of War', category: 'indoor' },
    { id: 'dog_parks', label: 'Dog Parks', category: 'social' },
    { id: 'hiking', label: 'Hiking', category: 'outdoor' },
    { id: 'agility', label: 'Agility Training', category: 'training' }
  ];

  private static readonly CAT_PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'independent', label: 'Independent', description: 'Prefers alone time', category: 'temperament' },
    { id: 'affectionate', label: 'Affectionate', description: 'Loves attention', category: 'social' },
    { id: 'playful', label: 'Playful', description: 'Enjoys toys and games', category: 'behavior' },
    { id: 'calm', label: 'Calm', description: 'Relaxed demeanor', category: 'temperament' },
    { id: 'curious', label: 'Curious', description: 'Explores surroundings', category: 'behavior' },
    { id: 'social', label: 'Social', description: 'Good with other cats', category: 'social' },
    { id: 'vocal', label: 'Vocal', description: 'Communicative meowing', category: 'behavior' },
    { id: 'lap_cat', label: 'Lap Cat', description: 'Loves sitting on laps', category: 'social' },
    { id: 'hunter', label: 'Hunter', description: 'Strong prey drive', category: 'behavior' },
    { id: 'shy', label: 'Shy', description: 'Cautious around strangers', category: 'temperament' },
    { id: 'energetic', label: 'Energetic', description: 'High activity level', category: 'behavior' },
    { id: 'gentle', label: 'Gentle', description: 'Good with children', category: 'temperament' }
  ];

  private static readonly CAT_CARE_OPTIONS: CareOption[] = [
    { id: 'litter_maintenance', label: 'Daily Litter Box Care', category: 'environment' },
    { id: 'regular_brushing', label: 'Regular Brushing', category: 'grooming' },
    { id: 'scratching_posts', label: 'Scratching Posts', category: 'environment' },
    { id: 'indoor_only', label: 'Indoor Only', category: 'environment' },
    { id: 'window_perches', label: 'Window Perches', category: 'environment' },
    { id: 'interactive_play', label: 'Daily Interactive Play', category: 'exercise' },
    { id: 'dental_care', label: 'Dental Care Routine', category: 'grooming' },
    { id: 'special_diet', label: 'Special Diet Requirements', category: 'feeding' }
  ];

  private static readonly CAT_ACTIVITIES: FavoriteActivity[] = [
    { id: 'laser_pointer', label: 'Laser Pointer', category: 'indoor' },
    { id: 'feather_wand', label: 'Feather Wand Play', category: 'indoor' },
    { id: 'catnip_toys', label: 'Catnip Toys', category: 'indoor' },
    { id: 'window_watching', label: 'Window Bird Watching', category: 'indoor' },
    { id: 'climbing_trees', label: 'Cat Tree Climbing', category: 'indoor' },
    { id: 'hunting_games', label: 'Hunting Games', category: 'indoor' },
    { id: 'puzzle_feeders', label: 'Puzzle Feeders', category: 'indoor' },
    { id: 'sunbathing', label: 'Sunbathing', category: 'indoor' },
    { id: 'exploring', label: 'Exploring New Spaces', category: 'indoor' },
    { id: 'socializing', label: 'Socializing with Humans', category: 'social' }
  ];

  private static readonly BIRD_PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'social', label: 'Social', description: 'Enjoys interaction', category: 'social' },
    { id: 'intelligent', label: 'Intelligent', description: 'Quick to learn', category: 'temperament' },
    { id: 'vocal', label: 'Vocal', description: 'Talkative and noisy', category: 'behavior' },
    { id: 'playful', label: 'Playful', description: 'Loves toys and games', category: 'behavior' },
    { id: 'curious', label: 'Curious', description: 'Investigates everything', category: 'behavior' },
    { id: 'affectionate', label: 'Affectionate', description: 'Bonds with owners', category: 'social' },
    { id: 'energetic', label: 'Energetic', description: 'Very active', category: 'behavior' },
    { id: 'gentle', label: 'Gentle', description: 'Calm and peaceful', category: 'temperament' },
    { id: 'independent', label: 'Independent', description: 'Content when alone', category: 'temperament' },
    { id: 'territorial', label: 'Territorial', description: 'Protective of space', category: 'behavior' }
  ];

  private static readonly BIRD_CARE_OPTIONS: CareOption[] = [
    { id: 'daily_flight_time', label: 'Daily Flight Time', category: 'exercise' },
    { id: 'cage_cleaning', label: 'Regular Cage Cleaning', category: 'environment' },
    { id: 'social_interaction', label: 'Daily Social Time', category: 'environment' },
    { id: 'specialized_diet', label: 'Species-Specific Diet', category: 'feeding' },
    { id: 'mental_enrichment', label: 'Mental Enrichment', category: 'exercise' },
    { id: 'quiet_sleep_area', label: 'Quiet Sleep Area', category: 'environment' },
    { id: 'temperature_control', label: 'Temperature Regulation', category: 'environment' },
    { id: 'beak_nail_care', label: 'Beak & Nail Care', category: 'grooming' }
  ];

  private static readonly BIRD_ACTIVITIES: FavoriteActivity[] = [
    { id: 'foraging', label: 'Foraging Games', category: 'indoor' },
    { id: 'puzzle_toys', label: 'Puzzle Toys', category: 'indoor' },
    { id: 'mirror_play', label: 'Mirror Interaction', category: 'social' },
    { id: 'music_dancing', label: 'Music & Dancing', category: 'social' },
    { id: 'talking_training', label: 'Talking/Mimicking', category: 'training' },
    { id: 'perch_swinging', label: 'Perch Swinging', category: 'indoor' },
    { id: 'shredding_toys', label: 'Shredding Toys', category: 'indoor' },
    { id: 'bathing', label: 'Bath Time', category: 'indoor' },
    { id: 'exploring', label: 'Supervised Exploration', category: 'indoor' },
    { id: 'trick_training', label: 'Trick Training', category: 'training' }
  ];

  private static readonly OTHER_PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'gentle', label: 'Gentle', description: 'Calm and peaceful', category: 'temperament' },
    { id: 'curious', label: 'Curious', description: 'Investigates surroundings', category: 'behavior' },
    { id: 'social', label: 'Social', description: 'Enjoys interaction', category: 'social' },
    { id: 'independent', label: 'Independent', description: 'Content alone', category: 'temperament' },
    { id: 'playful', label: 'Playful', description: 'Enjoys activities', category: 'behavior' },
    { id: 'calm', label: 'Calm', description: 'Relaxed nature', category: 'temperament' },
    { id: 'active', label: 'Active', description: 'High energy', category: 'behavior' },
    { id: 'affectionate', label: 'Affectionate', description: 'Bonds with owners', category: 'social' }
  ];

  private static readonly OTHER_CARE_OPTIONS: CareOption[] = [
    { id: 'specialized_habitat', label: 'Specialized Habitat', category: 'environment' },
    { id: 'species_specific_diet', label: 'Species-Specific Diet', category: 'feeding' },
    { id: 'temperature_humidity', label: 'Temperature & Humidity Control', category: 'environment' },
    { id: 'veterinary_specialist', label: 'Exotic Veterinarian', category: 'environment' },
    { id: 'enrichment_activities', label: 'Environmental Enrichment', category: 'exercise' },
    { id: 'specialized_handling', label: 'Specialized Handling', category: 'environment' }
  ];

  private static readonly OTHER_ACTIVITIES: FavoriteActivity[] = [
    { id: 'habitat_exploration', label: 'Habitat Exploration', category: 'indoor' },
    { id: 'enrichment_toys', label: 'Enrichment Toys', category: 'indoor' },
    { id: 'species_behaviors', label: 'Natural Species Behaviors', category: 'indoor' },
    { id: 'environmental_interaction', label: 'Environmental Interaction', category: 'indoor' }
  ];

  private static readonly EXERCISE_NEEDS = {
    dog: [
      { id: 'high', label: 'High Energy', value: 'high' as const, description: '2+ hours daily exercise' },
      { id: 'moderate', label: 'Moderate Energy', value: 'moderate' as const, description: '1-2 hours daily exercise' },
      { id: 'low', label: 'Low Energy', value: 'low' as const, description: '30-60 minutes daily exercise' }
    ],
    cat: [
      { id: 'high', label: 'Very Active', value: 'high' as const, description: 'Multiple play sessions daily' },
      { id: 'moderate', label: 'Moderately Active', value: 'moderate' as const, description: '1-2 play sessions daily' },
      { id: 'low', label: 'Low Activity', value: 'low' as const, description: 'Minimal structured play' }
    ],
    bird: [
      { id: 'high', label: 'Very Active', value: 'high' as const, description: 'Several hours of flight/activity' },
      { id: 'moderate', label: 'Moderately Active', value: 'moderate' as const, description: '1-2 hours of activity' },
      { id: 'low', label: 'Calm Nature', value: 'low' as const, description: 'Limited activity needs' }
    ],
    other: [
      { id: 'high', label: 'High Activity', value: 'high' as const, description: 'Species-specific high activity needs' },
      { id: 'moderate', label: 'Moderate Activity', value: 'moderate' as const, description: 'Species-specific moderate activity needs' },
      { id: 'low', label: 'Low Activity', value: 'low' as const, description: 'Species-specific low activity needs' }
    ]
  };

  public static getPersonalityProfile(species: 'dog' | 'cat' | 'bird' | 'other'): SpeciesPersonalityProfile {
    switch (species) {
      case 'dog':
        return {
          species,
          personalityTraits: this.DOG_PERSONALITY_TRAITS,
          careOptions: this.DOG_CARE_OPTIONS,
          favoriteActivities: this.DOG_ACTIVITIES,
          exerciseNeeds: this.EXERCISE_NEEDS.dog
        };
      
      case 'cat':
        return {
          species,
          personalityTraits: this.CAT_PERSONALITY_TRAITS,
          careOptions: this.CAT_CARE_OPTIONS,
          favoriteActivities: this.CAT_ACTIVITIES,
          exerciseNeeds: this.EXERCISE_NEEDS.cat
        };
      
      case 'bird':
        return {
          species,
          personalityTraits: this.BIRD_PERSONALITY_TRAITS,
          careOptions: this.BIRD_CARE_OPTIONS,
          favoriteActivities: this.BIRD_ACTIVITIES,
          exerciseNeeds: this.EXERCISE_NEEDS.bird
        };
      
      case 'other':
      default:
        return {
          species: 'other',
          personalityTraits: this.OTHER_PERSONALITY_TRAITS,
          careOptions: this.OTHER_CARE_OPTIONS,
          favoriteActivities: this.OTHER_ACTIVITIES,
          exerciseNeeds: this.EXERCISE_NEEDS.other
        };
    }
  }

  public static getAllPersonalityTraits(species: 'dog' | 'cat' | 'bird' | 'other'): PersonalityTrait[] {
    return this.getPersonalityProfile(species).personalityTraits;
  }

  public static getAllCareOptions(species: 'dog' | 'cat' | 'bird' | 'other'): CareOption[] {
    return this.getPersonalityProfile(species).careOptions;
  }

  public static getAllFavoriteActivities(species: 'dog' | 'cat' | 'bird' | 'other'): FavoriteActivity[] {
    return this.getPersonalityProfile(species).favoriteActivities;
  }

  public static getExerciseOptions(species: 'dog' | 'cat' | 'bird' | 'other') {
    return this.getPersonalityProfile(species).exerciseNeeds;
  }

  public static getPersonalityTraitsByCategory(
    species: 'dog' | 'cat' | 'bird' | 'other',
    category: 'temperament' | 'behavior' | 'social'
  ): PersonalityTrait[] {
    return this.getAllPersonalityTraits(species).filter(trait => trait.category === category);
  }

  public static getCareOptionsByCategory(
    species: 'dog' | 'cat' | 'bird' | 'other',
    category: 'exercise' | 'grooming' | 'feeding' | 'environment'
  ): CareOption[] {
    return this.getAllCareOptions(species).filter(option => option.category === category);
  }

  public static getActivitiesByCategory(
    species: 'dog' | 'cat' | 'bird' | 'other',
    category: 'indoor' | 'outdoor' | 'social' | 'training'
  ): FavoriteActivity[] {
    return this.getAllFavoriteActivities(species).filter(activity => activity.category === category);
  }
}

export default PetPersonalityService;