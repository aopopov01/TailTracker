import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
}

interface BusinessRule {
  name: string;
  description: string;
  validate: (
    data: any,
    context: any
  ) => Promise<{ valid: boolean; error?: string }>;
}

// Pet profile validation rules
const petValidationRules: ValidationRule[] = [
  {
    field: 'name',
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  {
    field: 'species',
    type: 'string',
    required: true,
    enum: [
      'Dog',
      'Cat',
      'Bird',
      'Rabbit',
      'Guinea Pig',
      'Hamster',
      'Fish',
      'Reptile',
      'Other',
    ],
  },
  { field: 'breed', type: 'string', maxLength: 100 },
  { field: 'date_of_birth', type: 'date' },
  { field: 'gender', type: 'string', enum: ['male', 'female', 'unknown'] },
  { field: 'weight', type: 'number', min: 0.1, max: 500 },
  {
    field: 'microchip_id',
    type: 'string',
    maxLength: 50,
    pattern: '^[A-Z0-9]{15}$',
  },
];

// User profile validation rules
const userValidationRules: ValidationRule[] = [
  { field: 'email', type: 'email', required: true },
  {
    field: 'full_name',
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 255,
  },
  {
    field: 'subscription_tier',
    type: 'string',
    enum: ['free', 'premium', 'family'],
  },
];

// Vaccination validation rules
const vaccinationValidationRules: ValidationRule[] = [
  { field: 'pet_id', type: 'uuid', required: true },
  {
    field: 'vaccine_name',
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  { field: 'administered_date', type: 'date', required: true },
  { field: 'next_due_date', type: 'date' },
  { field: 'veterinarian_name', type: 'string', maxLength: 100 },
  { field: 'batch_number', type: 'string', maxLength: 50 },
];

// Business rules
const businessRules: BusinessRule[] = [
  {
    name: 'max_pets_per_user',
    description:
      'Free users can have max 3 pets, premium users can have unlimited',
    validate: async (data: any, context: any) => {
      if (data.table !== 'pets' || data.operation !== 'INSERT') {
        return { valid: true };
      }

      const { data: userProfile } = await context.supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', data.user_id)
        .single();

      if (userProfile?.subscription_tier === 'free') {
        const { count } = await context.supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.user_id);

        if (count >= 3) {
          return {
            valid: false,
            error:
              'Free accounts are limited to 3 pets. Upgrade to premium for unlimited pets.',
          };
        }
      }

      return { valid: true };
    },
  },
  {
    name: 'microchip_uniqueness',
    description: 'Microchip IDs must be unique across all pets',
    validate: async (data: any, context: any) => {
      if (data.table !== 'pets' || !data.microchip_id) {
        return { valid: true };
      }

      let query = context.supabase
        .from('pets')
        .select('id')
        .eq('microchip_id', data.microchip_id);

      // For updates, exclude the current pet
      if (data.operation === 'UPDATE' && data.id) {
        query = query.neq('id', data.id);
      }

      const { data: existingPet } = await query.single();

      if (existingPet) {
        return {
          valid: false,
          error: 'This microchip ID is already registered to another pet.',
        };
      }

      return { valid: true };
    },
  },
  {
    name: 'vaccination_date_logic',
    description:
      'Vaccination dates must be logical (administered <= today, next due > administered)',
    validate: async (data: any, context: any) => {
      if (data.table !== 'vaccinations') {
        return { valid: true };
      }

      const today = new Date();
      const administeredDate = new Date(data.administered_date);
      const nextDueDate = data.next_due_date
        ? new Date(data.next_due_date)
        : null;

      // Administered date cannot be in the future
      if (administeredDate > today) {
        return {
          valid: false,
          error: 'Vaccination administered date cannot be in the future.',
        };
      }

      // Next due date must be after administered date
      if (nextDueDate && nextDueDate <= administeredDate) {
        return {
          valid: false,
          error: 'Next due date must be after the administered date.',
        };
      }

      return { valid: true };
    },
  },
  {
    name: 'pet_ownership_verification',
    description: 'Users can only modify pets they own',
    validate: async (data: any, context: any) => {
      if (data.table !== 'pets' || data.operation === 'INSERT') {
        return { valid: true };
      }

      const { data: pet } = await context.supabase
        .from('pets')
        .select('user_id')
        .eq('id', data.id || data.pet_id)
        .single();

      if (!pet || pet.user_id !== context.userId) {
        return {
          valid: false,
          error: 'You can only modify pets you own.',
        };
      }

      return { valid: true };
    },
  },
  {
    name: 'sharing_token_limits',
    description: 'Users have limits on active sharing tokens',
    validate: async (data: any, context: any) => {
      if (data.table !== 'sharing_tokens' || data.operation !== 'INSERT') {
        return { valid: true };
      }

      const { count } = await context.supabase
        .from('sharing_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', data.owner_user_id)
        .gt('expires_at', new Date().toISOString());

      const { data: userProfile } = await context.supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', data.owner_user_id)
        .single();

      const maxTokens = userProfile?.subscription_tier === 'free' ? 3 : 10;

      if (count >= maxTokens) {
        return {
          valid: false,
          error: `${userProfile?.subscription_tier === 'free' ? 'Free' : 'Premium'} accounts are limited to ${maxTokens} active sharing tokens.`,
        };
      }

      return { valid: true };
    },
  },
];

// Validation functions
const validateField = (
  value: any,
  rule: ValidationRule
): { valid: boolean; error?: string } => {
  // Check required
  if (
    rule.required &&
    (value === undefined || value === null || value === '')
  ) {
    return { valid: false, error: `${rule.field} is required` };
  }

  // Skip validation if value is empty and not required
  if (
    !rule.required &&
    (value === undefined || value === null || value === '')
  ) {
    return { valid: true };
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `${rule.field} must be a string` };
      }
      if (rule.minLength && value.length < rule.minLength) {
        return {
          valid: false,
          error: `${rule.field} must be at least ${rule.minLength} characters`,
        };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return {
          valid: false,
          error: `${rule.field} must not exceed ${rule.maxLength} characters`,
        };
      }
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        return { valid: false, error: `${rule.field} format is invalid` };
      }
      if (rule.enum && !rule.enum.includes(value)) {
        return {
          valid: false,
          error: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
        };
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, error: `${rule.field} must be a number` };
      }
      if (rule.min && num < rule.min) {
        return {
          valid: false,
          error: `${rule.field} must be at least ${rule.min}`,
        };
      }
      if (rule.max && num > rule.max) {
        return {
          valid: false,
          error: `${rule.field} must not exceed ${rule.max}`,
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${rule.field} must be a boolean` };
      }
      break;

    case 'date':
      if (!(value instanceof Date) && isNaN(Date.parse(value))) {
        return { valid: false, error: `${rule.field} must be a valid date` };
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          valid: false,
          error: `${rule.field} must be a valid email address`,
        };
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        return { valid: false, error: `${rule.field} must be a valid URL` };
      }
      break;

    case 'uuid':
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        return { valid: false, error: `${rule.field} must be a valid UUID` };
      }
      break;
  }

  return { valid: true };
};

const validateData = (
  data: any,
  rules: ValidationRule[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const rule of rules) {
    const result = validateField(data[rule.field], rule);
    if (!result.valid) {
      errors.push(result.error!);
    }
  }

  return { valid: errors.length === 0, errors };
};

const getValidationRules = (table: string): ValidationRule[] => {
  switch (table) {
    case 'pets':
      return petValidationRules;
    case 'user_profiles':
      return userValidationRules;
    case 'vaccinations':
      return vaccinationValidationRules;
    default:
      return [];
  }
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify JWT token
    const { data: user, error: authError } =
      await supabaseClient.auth.getUser(token);
    if (authError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { table, operation, data } = await req.json();

    if (!table || !operation || !data) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: table, operation, data',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const context = {
      supabase: supabaseClient,
      userId: user.user.id,
      userEmail: user.user.email,
    };

    // Validate data structure
    const validationRules = getValidationRules(table);
    const structuralValidation = validateData(data, validationRules);

    if (!structuralValidation.valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: structuralValidation.errors,
          type: 'validation_error',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Apply business rules
    const businessRuleErrors: string[] = [];

    for (const rule of businessRules) {
      const result = await rule.validate(
        { table, operation, ...data },
        context
      );
      if (!result.valid) {
        businessRuleErrors.push(result.error!);
      }
    }

    if (businessRuleErrors.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: businessRuleErrors,
          type: 'business_rule_error',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // All validations passed
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Validation successful',
        validated_data: data,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (_error) {
    console.error('API middleware error:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message,
        type: 'system_error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
