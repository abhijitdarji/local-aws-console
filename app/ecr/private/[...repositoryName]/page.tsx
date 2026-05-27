import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { getEcrImages, getEcrRepository, getEcrRepositoryPolicy } from '@/app/lib/server/aws/ecr';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { EcrPrivateDetail } from './_components/ecr-private-detail';

export default async function EcrPrivateDetailPage({
  params,
}: {
  params: Promise<{ repositoryName: string[] }>;
}) {
  const { repositoryName } = await params;
  const repoName = repositoryName.map(decodeURIComponent).join('/');
  const { env, region } = await resolveEnvRegion();

  // getEcrRepository decides existence — if missing, ECR throws
  // RepositoryNotFoundException, which the helper converts to notFound().
  await awaitOrNotFound(getEcrRepository(env, region, repoName));

  const detailsPromise = Promise.all([
    getEcrRepository(env, region, repoName),
    getEcrImages(env, region, repoName),
    getEcrRepositoryPolicy(env, region, repoName),
  ]);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'ECR');
  }

  return (
    <EcrPrivateDetail
      repositoryName={repoName}
      region={region}
      detailsPromise={detailsPromise as any}
      onRefresh={refresh}
    />
  );
}
