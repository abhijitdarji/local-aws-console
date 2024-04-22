import SideNavigation, { SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import { useLocation } from "react-router-dom";
import { useOnFollow } from "../hooks/use-on-follow";

const nav: SideNavigationProps.Item[] = [
    {
      type: 'link',
      text: 'Favorites',
      href: '/favorites',
    },
    {
      type: 'divider'
    },
    // {
    //   type: 'section',
    //   text: 'API Gateway',
    //   items: [
    //     { type: 'link', text: 'APIs', href: '/apigateway' },
    //   ],
    // },
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
        // { type: 'link', text: 'CloudWatch', href: '/cloudwatch' },
        { type: 'link', text: 'Log Groups', href: '/cloudwatchlogs' },
        { type: 'link', text: 'Log Insights', href: '/cloudwatchlogs/loginsights' },
        // { type: 'link', text: 'Dashboards', href: '/cloudwatch/dashboards' },
        // { type: 'link', text: 'Alarms', href: '/cloudwatch/alarms' },
      ],
    },
    // {
    //   type: 'section',
    //   text: 'Cognito',
    //   items: [
    //     { type: 'link', text: 'User Pools', href: '/cogito/userpools' },
    //     { type: 'link', text: 'Identity Pools', href: '/cogito/identitypools' },
    //   ],
    // },
    {
      type: 'section',
      text: 'Lambda',
      items: [
        { type: 'link', text: 'Functions', href: '/lambda' },
      ],
    },
    {
      type: 'section',
      text: 'SQS',
      items: [
        { type: 'link', text: 'Queues', href: '/sqs' },
      ],
    },
    {
      type: 'section',
      text: 'SNS',
      items: [
        { type: 'link', text: 'Topics', href: '/sns' },
      ],
    },
    // {
    //   type: 'section',
    //   text: 'S3',
    //   items: [
    //     { type: 'link', text: 'Buckets', href: '/s3' },
    //   ],
    // },
    {
      type: 'section',
      text: 'DynamoDB',
      items: [
        { type: 'link', text: 'Tables', href: '/dynamodb' },
      ],
    },
    {
      type: 'section',
      text: 'Secrets Manager',
      items: [
        { type: 'link', text: 'Secrets', href: '/secretsmanager' },
      ],
    },
    // {
    //   type: 'section',
    //   text: 'ECS',
    //   items: [
    //     { type: 'link', text: 'Clusters', href: '/ecs' },
    //     { type: 'link', text: 'Task Definitions', href: '/ecs/taskdefinitions' },
    //     { type: 'link', text: 'Tasks', href: '/ecs/tasks' },
    //     { type: 'link', text: 'Services', href: '/ecs/services' },
    //     { type: 'link', text: 'Container Instances', href: '/ecs/containerinstances' },
    //   ],
    // }
  ];

export const LeftMenu = () => {
  const location = useLocation();
  const onFollow = useOnFollow();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  let longestMatch = '';

  for (let i = pathSegments.length; i > 0; i--) {
    const pathToCheck = '/' + pathSegments.slice(0, i).join('/');
    let match: SideNavigationProps.Item | undefined;

    match = nav.find((item) => {
      
      switch (item.type) {
        case 'link':
          return item.href === pathToCheck;
        case 'section':
          return item.items?.find((subItem: any) => subItem.href === pathToCheck);
        default:
          break;
      }
    });

    if (match && pathToCheck.length > longestMatch.length) {
      longestMatch = pathToCheck;
    }
  }

  const activeItem = longestMatch || '/';

  return <>
    <SideNavigation
      activeHref={activeItem}
      header={{
        href: "/",
        text: "Home",
      }}
      onFollow={onFollow}
      items={nav} />
  </>
};