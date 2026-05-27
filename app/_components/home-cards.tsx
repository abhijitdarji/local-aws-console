'use client';

import { Box, Cards, Link } from '@cloudscape-design/components';
import { useOnFollow } from '@/app/hooks/use-on-follow';

const services = [
  { title: 'Lambda', href: '/lambda', description: 'Serverless functions' },
  { title: 'ECR', href: '/ecr', description: 'Container image repositories' },
  {
    title: 'CloudFormation',
    href: '/cloudformation',
    description: 'Infrastructure as code stacks',
  },
  { title: 'SNS', href: '/sns', description: 'Simple Notification Service topics' },
  { title: 'SQS', href: '/sqs', description: 'Simple Queue Service queues' },
  { title: 'CloudWatch Logs', href: '/cloudwatchlogs', description: 'Log groups and log insights' },
  { title: 'DynamoDB', href: '/dynamodb', description: 'NoSQL database tables' },
  { title: 'Secrets Manager', href: '/secretsmanager', description: 'Secrets and credentials' },
  { title: 'S3', href: '/s3', description: 'Object storage buckets' },
];

export function HomeCards() {
  const onFollow = useOnFollow();

  return (
    <Cards
      cardDefinition={{
        header: (item) => (
          <Link href={item.href} fontSize="heading-m" onFollow={onFollow}>
            {item.title}
          </Link>
        ),
        sections: [
          {
            id: 'description',
            content: (item) => <Box color="text-body-secondary">{item.description}</Box>,
          },
        ],
      }}
      cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 900, cards: 4 }]}
      items={services}
      trackBy="title"
    />
  );
}
