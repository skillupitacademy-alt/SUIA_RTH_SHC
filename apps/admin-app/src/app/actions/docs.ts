'use server';

import { getDocContent as getDocContentLoader } from '@/lib/docs-loader';


export async function getDocContentAction(path: string) {
  try {
    const content = await getDocContentLoader(path);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
