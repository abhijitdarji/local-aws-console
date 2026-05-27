'use client';

import SideNavigation, {
  type SideNavigationProps,
} from '@cloudscape-design/components/side-navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

const nav: SideNavigationProps.Item[] = [
  { type: 'link', text: 'Favorites', href: '/favorites' },
  { type: 'divider' },
  {
    type: 'section',
    text: 'Cloud Formation',
    items: [
      { type: 'link', text: 'Stacks', href: '/cloudformation' },
      { type: 'link', text: 'Exports', href: '/cloudformation/exports' },
    ],
  },
  {
    type: 'section',
    text: 'Cloud Watch',
    items: [
      { type: 'link', text: 'Log Groups', href: '/cloudwatchlogs' },
      { type: 'link', text: 'Log Insights', href: '/cloudwatchlogs/loginsights' },
    ],
  },
  {
    type: 'section',
    text: 'ECR',
    items: [{ type: 'link', text: 'Repositories', href: '/ecr' }],
  },
  {
    type: 'section',
    text: 'Lambda',
    items: [{ type: 'link', text: 'Functions', href: '/lambda' }],
  },
  {
    type: 'section',
    text: 'SQS',
    items: [{ type: 'link', text: 'Queues', href: '/sqs' }],
  },
  {
    type: 'section',
    text: 'SNS',
    items: [{ type: 'link', text: 'Topics', href: '/sns' }],
  },
  {
    type: 'section',
    text: 'S3',
    items: [{ type: 'link', text: 'Buckets', href: '/s3' }],
  },
  {
    type: 'section',
    text: 'DynamoDB',
    items: [{ type: 'link', text: 'Tables', href: '/dynamodb' }],
  },
  {
    type: 'section',
    text: 'Secrets Manager',
    items: [{ type: 'link', text: 'Secrets', href: '/secretsmanager' }],
  },
];

export function LeftMenu() {
  const pathname = usePathname();
  const router = useRouter();

  const onFollow = useCallback(
    (event: CustomEvent<{ href?: string; external?: boolean }>) => {
      if (event.detail.external || !event.detail.href) return;
      event.preventDefault();
      router.push(event.detail.href);
    },
    [router],
  );

  // Find the best-matching active href
  const segments = pathname.split('/').filter(Boolean);
  let activeHref = '/';

  for (let i = segments.length; i > 0; i--) {
    const candidate = '/' + segments.slice(0, i).join('/');
    const found = nav.some((item) => {
      if (item.type === 'link') return item.href === candidate;
      if (item.type === 'section') return item.items?.some((sub: any) => sub.href === candidate);
      return false;
    });
    if (found && candidate.length > activeHref.length) {
      activeHref = candidate;
    }
  }

  return (
    <SideNavigation
      activeHref={activeHref}
      header={{ href: '/', text: 'Home' }}
      onFollow={onFollow}
      items={nav}
    />
  );
}
