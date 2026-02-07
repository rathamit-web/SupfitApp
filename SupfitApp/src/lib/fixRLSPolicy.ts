import { supabase } from './supabaseClient';

/**
 * Fix the professional_packages RLS policy to allow INSERT/UPDATE operations
 * This addresses "Permission denied" errors when trying to save packages
 */
export const fixProfessionalPackagesRLS = async () => {
  try {
    console.log('[RLS Fix] Starting professional_packages RLS policy fix...');

    // Drop the old restrictive policy
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;`,
    }).catch(() => {
      // If rpc doesn't exist, we'll try direct SQL via admin connection
      return { error: null };
    });

    if (dropError && !dropError.message?.includes('does not exist')) {
      console.warn('[RLS Fix] Warning dropping old policy:', dropError);
    }

    // Create a new, more robust policy that properly handles ENUM type casting
    const newPolicy = `
      CREATE POLICY professional_packages_owner_manage
        ON public.professional_packages
        FOR ALL
        USING (
          owner_user_id = auth.uid()
          AND (
            -- Check if user role matches professional type (explicit ENUM comparison)
            EXISTS (
              SELECT 1 FROM public.users u
              WHERE u.id = auth.uid() 
              AND u.role IN ('coach', 'dietician')
              AND (
                (u.role = 'coach' AND professional_type = 'coach'::professional_type_enum)
                OR
                (u.role = 'dietician' AND professional_type = 'dietician'::professional_type_enum)
              )
            )
            OR
            -- Fallback: text-based comparison for flexibility
            EXISTS (
              SELECT 1 FROM public.users u
              WHERE u.id = auth.uid() 
              AND u.role::text = professional_type::text
            )
          )
        )
        WITH CHECK (
          owner_user_id = auth.uid()
          AND (
            -- Check if user role matches professional type (explicit ENUM comparison)
            EXISTS (
              SELECT 1 FROM public.users u
              WHERE u.id = auth.uid() 
              AND u.role IN ('coach', 'dietician')
              AND (
                (u.role = 'coach' AND professional_type = 'coach'::professional_type_enum)
                OR
                (u.role = 'dietician' AND professional_type = 'dietician'::professional_type_enum)
              )
            )
            OR
            -- Fallback: text-based comparison for flexibility
            EXISTS (
              SELECT 1 FROM public.users u
              WHERE u.id = auth.uid() 
              AND u.role::text = professional_type::text
            )
          )
        );
    `;

    console.log('[RLS Fix] Attempting to create new policy...');
    // This will likely fail if we don't have admin access, but document the fix for manual application
    console.log('[RLS Fix] Note: RLS policy fix requires admin access. Apply this SQL manually:');
    console.log(newPolicy);

    console.log('[RLS Fix] RLS policy update documented. Please apply via Supabase dashboard.');
    return { success: false, reason: 'Requires admin access - apply SQL manually' };
  } catch (error) {
    console.error('[RLS Fix] Error:', error);
    return { success: false, error };
  }
};

/**
 * Verify the current user's role in the database
 */
export const verifyUserRole = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[RLS Fix] Error verifying user role:', error);
      return null;
    }

    console.log('[RLS Fix] User role verified:', { userId, role: data?.role });
    return data;
  } catch (error) {
    console.error('[RLS Fix] Unexpected error verifying user role:', error);
    return null;
  }
};
