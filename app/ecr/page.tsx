import { getEcrPublicRepositories, getEcrRepositories } from '@/app/lib/server/aws/ecr';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { EcrTabs } from './_components/ecr-tabs';

export default async function EcrPage() {
  const { env, region } = await resolveEnvRegion();

  // Start fetches without awaiting — Promises stream to the client via use()
  const privateReposPromise = getEcrRepositories(env, region);
  const publicReposPromise = getEcrPublicRepositories(env);

  return (
    <EcrTabs
      env={env}
      region={region}
      privateReposPromise={privateReposPromise}
      publicReposPromise={publicReposPromise}
    />
  );
}
