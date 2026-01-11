import { supabase } from '../lib/supabaseClient';

export async function uploadWorkoutImage(localUri: string, userId: string): Promise<string> {
  try {
    const fileExt = localUri.split('.').pop();
    const fileName = `workouts/${userId}_${Date.now()}.${fileExt}`;
    const response = await fetch(localUri);
    if (!response.ok) {
      throw new Error('Failed to read image file.');
    }
    const blob = await response.blob();
    const contentType = blob.type || (fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : fileExt === 'png' ? 'image/png' : 'image/*');
    const { error: uploadError } = await supabase.storage
      .from('workouts')
      .upload(fileName, blob, { contentType, upsert: true });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from('workouts').getPublicUrl(fileName);
    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to generate image URL after upload.');
    }
    return publicUrlData.publicUrl;
  } catch (e) {
    throw e;
  }
}
