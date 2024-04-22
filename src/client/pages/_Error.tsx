import { Box, Container, Header } from "@cloudscape-design/components";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <Container header={
        <Header variant="h1">
          Oops!
        </Header>
      }>
        <p>Sorry, an unexpected error has occurred.</p>
        <Box>{error.statusText || error.message}</Box>
      </Container>
    </div>
  );
}