import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import {
  getEcrPublicCatalogData,
  getEcrPublicImages,
  getEcrPublicRepository,
} from '@/app/lib/server/aws/ecr';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { EcrPublicDetail } from './_components/ecr-public-detail';

export default async function EcrPublicDetailPage({
  params,
}: {
  params: Promise<{ repositoryName: string[] }>;
}) {
  const { repositoryName } = await params;
  const repoName = repositoryName.map(decodeURIComponent).join('/');
  const { env } = await resolveEnvRegion();

  await awaitOrNotFound(getEcrPublicRepository(env, repoName));

  const detailsPromise = Promise.all([
    getEcrPublicRepository(env, repoName),
    getEcrPublicImages(env, repoName),
    getEcrPublicCatalogData(env, repoName),
  ]);

  async function refresh() {
    'use server';
    await revalidateAws(env, 'us-east-1', 'ECRPUBLIC');
  }

  return (
    <EcrPublicDetail
      repositoryName={repoName}
      detailsPromise={detailsPromise as any}
      onRefresh={refresh}
    />
  );
}
