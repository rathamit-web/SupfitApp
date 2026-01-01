import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';

export async function uploadWorkoutImage(localUri: string, userId: string): Promise<string | null> {
  try {
    const fileExt = localUri.split('.').pop();
    const fileName = `workouts/${userId}_${Date.now()}.${fileExt}`;
    const fileData = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    const { error: uploadError } = await supabase.storage
      .from('workouts')
      .upload(fileName, Buffer.from(fileData, 'base64'), { contentType: 'image/*', upsert: true });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from('workouts').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  } catch (e) {
    return null;
  }
}
