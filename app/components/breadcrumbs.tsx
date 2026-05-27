'use client';

import BreadcrumbGroup, {
  type BreadcrumbGroupProps,
} from '@cloudscape-design/components/breadcrumb-group';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useOnFollow } from '@/app/hooks/use-on-follow';

export function Breadcrumbs() {
  const pathname = usePathname();
  const onFollow = useOnFollow();

  const breadcrumbs = useMemo<BreadcrumbGroupProps.Item[]>(() => {
    const base: BreadcrumbGroupProps.Item = { text: 'Home', href: '/' };
    const pathnames = pathname.split('/').filter(Boolean);

    if (pathnames[0] === 'favorites' && pathnames.length > 1) {
      return [base];
    }

    const subPaths = pathnames.map((value, index) => {
      let href = `/${pathnames.slice(0, index + 1).join('/')}`;
      if (pathnames[0] === 's3') href += '/';
      const label = decodeURIComponent(value);
      return {
        text: label.length > 17 ? label.substring(0, 17) + '...' : label,
        href,
      };
    });

    return [base, ...subPaths];
  }, [pathname]);

  return (
    <BreadcrumbGroup
      items={breadcrumbs}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
      onFollow={onFollow}
    />
  );
}
