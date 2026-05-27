import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import { AppShell } from '@/app/components/app-shell';
import { StoreHydrator } from '@/app/lib/client/store/store-hydrator';
import { listRegions } from '@/app/lib/server/actions/settings';
import '@cloudscape-design/global-styles/index.css';

export const metadata: Metadata = {
  title: 'Local AWS Console',
  description: 'Local readonly AWS console',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Regions are static config — safe to pre-render at build time
  // Environments are read from ~/.aws which is a runtime Docker volume —
  // loaded client-side via server action to avoid baking empty results into the static shell
  const regions = await listRegions();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StoreHydrator regions={regions} />
          {/* Cloudscape AppLayout calls Date.now() internally for animation timing.
              Suspense here satisfies Next.js 16's requirement that Client Components
              using Date.now() must be inside a Suspense boundary. SSR still fully
              renders the layout at request time; fallback only appears in the
              static build shell (irrelevant for this auth-gated app). */}
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
