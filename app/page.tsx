import { ContentLayout, Header } from '@cloudscape-design/components';
import { HomeCards } from './_components/home-cards';

export default function HomePage() {
  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Select an AWS service to get started">
          Local AWS Console
        </Header>
      }
    >
      <HomeCards />
    </ContentLayout>
  );
}
