'use client';

type Props = {
  runtime?: string;
  size?: number;
};

function pickIcon(runtime: string): string | null {
  const r = runtime.toLowerCase();
  if (r.startsWith('dotnet')) return '/dotnet.svg';
  if (r.startsWith('java')) return '/java.svg';
  if (r.startsWith('node')) return '/nodejs.svg';
  if (r.startsWith('python')) return '/python.svg';
  if (r.startsWith('ruby')) return '/ruby.svg';
  if (r.startsWith('go')) return '/go.svg';
  return null;
}

export function LambdaRuntimeIcon({ runtime, size = 24 }: Props) {
  if (!runtime) return <span>—</span>;
  const icon = pickIcon(runtime);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <img src={icon} alt={runtime} height={size} width={size} />}
      <span>{runtime}</span>
    </div>
  );
}
