# Local AWS Console

A local AWS console that can be used to interact with AWS services across multiple AWS profiles and regions based on the aws cli configuration.

## Features

### AWS Services
- CloudFormation Stacks, Exports
- CloudWatch Logs, Log Insights
- DynamoDB
- Lambda
- SNS
- SQS
- Secrets Manager

### Application Features
- Multiple AWS profiles
- Multiple AWS regions
- Dark mode
- Favorites for services across profiles
- Logs insights saved queries
- JSON file database for storing favorites and saved queries

## Built With

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Cloudscape Design System](https://cloudscape.design/)
- [AWS SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- [Express](https://expressjs.com/)

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
- AWS CLI configuration
- Optional AWS CLI configuration for LocalStack

### Installation

1. Using docker compose

- mount the AWS configuration directory to the container
- mount the configuration directory to the container
- the configuration directory should contain the `default.json` file which contains the regions enabled

```json
{
    "ENABLED_REGIONS": [
        {
            "name": "US East (N. Virginia)",
            "code": "us-east-1"
        },
        {
            "name": "US East (Ohio)",
            "code": "us-east-2"
        }
    ]
}
```

- create db.json for favorites and saved queries

- docker compose file
```yaml
version: '3.9'
services:
  app:
    build: .
    image: adarji/local-aws-console:1.0.0
    container_name: local-aws-console
    ports:
      - '8080:8080'
    volumes:
      - $HOME/.aws:/root/.aws
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - VITE_PORT=8080
```

2. Clone the repository

```bash
git clone
cd local-aws-console
npm install
npm run dev
```

## Usage

1. Open the browser and navigate to `http://localhost:8080`
2. Select the profile and region
3. Click on the service to interact with the service