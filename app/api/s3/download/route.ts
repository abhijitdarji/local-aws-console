import { GetObjectCommand } from '@aws-sdk/client-s3';
import { type NextRequest, NextResponse } from 'next/server';
import { listEnvironments } from '@/app/lib/server/actions/settings';
import { getAwsClient } from '@/app/lib/server/aws-client-manager';
import { log } from '@/app/lib/server/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const env = searchParams.get('env');
  const region = searchParams.get('region');
  const bucket = searchParams.get('bucket');
  const key = searchParams.get('key');

  if (!env || !region || !bucket || !key) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const environments = await listEnvironments();
    const allEnvs = [...environments.sso, ...environments.key];
    if (!allEnvs.includes(env)) {
      return NextResponse.json({ error: 'Unknown environment' }, { status: 400 });
    }

    const profileType = environments.sso.includes(env) ? 'sso' : 'key';
    const client = await getAwsClient('S3', env, profileType, region);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await (client.send(command) as unknown as Promise<{
      Body?: ReadableStream | { transformToWebStream(): ReadableStream };
      ContentType?: string;
      ContentLength?: number;
    }>);

    if (!response.Body) {
      return NextResponse.json({ error: 'No body in response' }, { status: 404 });
    }

    const stream =
      'transformToWebStream' in response.Body
        ? response.Body.transformToWebStream()
        : (response.Body as ReadableStream);

    const filename = key.split('/').pop() ?? key;

    return new NextResponse(stream, {
      headers: {
        'Content-Type': response.ContentType ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(response.ContentLength ? { 'Content-Length': String(response.ContentLength) } : {}),
      },
    });
  } catch (error) {
    log.error({ env, region, bucket, key, err: error }, 's3.download.error');
    return NextResponse.json({ error: 'Failed to download object' }, { status: 500 });
  }
}
