'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface FollowDetail {
  external?: boolean;
  href?: string;
}

/**
 * Returns a stable onFollow handler for Cloudscape components (Link, BreadcrumbGroup,
 * SideNavigation). Cloudscape renders its own <a> tags, so without this handler
 * every click causes a full browser reload. This intercepts the event and delegates
 * to Next.js's router.push() for SPA (client-side) navigation.
 *
 * useCallback keeps the function reference stable so Cloudscape does not detach and
 * re-attach its internal click handler on every render — which was the cause of
 * intermittent full-page reloads when clicking during a re-render.
 *
 * Note: next/link handles SPA navigation automatically — this hook is only needed
 * for Cloudscape components that fire their own onFollow event.
 */
export function useOnFollow() {
  const router = useRouter();

  return useCallback(
    (event: CustomEvent<FollowDetail>): void => {
      if (event.detail.external === true || typeof event.detail.href === 'undefined') {
        return;
      }
      event.preventDefault();
      router.push(event.detail.href);
    },
    [router],
  );
}
