'use server';

import { revalidateTag } from 'next/cache';

export async function revalidateAws(env: string, region: string, service?: string) {
  revalidateTag(service ? `aws:${env}:${region}:${service}` : `aws:${env}:${region}`, {});
}
