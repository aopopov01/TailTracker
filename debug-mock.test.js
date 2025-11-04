/**
 * Debug mock test to isolate the supabase mocking issue
 */

import { supabase } from '@/lib/supabase';

describe('Supabase Mock Debug', () => {
  test('should have getUser function', () => {
    console.log('🔍 TEST: supabase object:', supabase);
    console.log('🔍 TEST: supabase.auth:', supabase.auth);
    console.log('🔍 TEST: supabase.auth.getUser:', supabase.auth.getUser);
    console.log(
      '🔍 TEST: getUser implementation:',
      supabase.auth.getUser.getMockImplementation()
    );

    expect(supabase.auth.getUser).toBeDefined();
    expect(typeof supabase.auth.getUser).toBe('function');
  });

  test('should return correct data from getUser', async () => {
    const result = await supabase.auth.getUser();
    console.log('🔍 TEST: getUser result:', result);

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.user).toBeDefined();
    expect(result.data.user.id).toBe('auth-user-1');
  });
});
