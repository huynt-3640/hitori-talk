import type { SupportedLanguage } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from './index';

export async function getServerTranslations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('preferred_language')
    .single();
  const lang = (data?.preferred_language ?? 'vi') as SupportedLanguage;
  return getTranslations(lang);
}
