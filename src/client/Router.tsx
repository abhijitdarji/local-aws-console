import {
    createBrowserRouter,
    Outlet,
    RouterProvider
} from "react-router-dom";
import { App } from "./App";
import { CloudFormationHome } from "./pages/CloudFormation/CloudFormation";
import { Home } from "./pages/Home";
import { FunctionDetail } from "./pages/Lambda/FunctionDetails";
import { LambdaHome } from "./pages/Lambda/Lambda";
import ErrorPage from "./pages/_Error";
import { SNSHome } from "./pages/SNS/SNS";
import { SQSHome } from "./pages/SQS/SQS";
import { CloudWatchLogsHome } from "./pages/CloudWatchLogs/CloudWatchLogs";
import { DynamoDBHome } from "./pages/DynamoDB/DynamoDB";
import { LogStreams } from "./pages/CloudWatchLogs/LogStreams";
import { LogEvents } from "./pages/CloudWatchLogs/LogEvents";
import { LogInsights } from "./pages/CloudWatchLogs/LogInsights";
import { Favorites } from "./pages/Favorites/Favorites";
import { CloudFormationExports } from "./pages/CloudFormation/CloudFormationExports";
import { SecretsManagerHome } from "./pages/SecretsManager/SecretsManager";
import { ViewSecret } from "./pages/SecretsManager/ViewSecret";
import { TableDetailsLoader } from "./pages/DynamoDB/TableDetailsLoader";
import { useContext } from "react";
import { GlobalContext, GlobalContextType } from "./context/GlobalContext";
import { APIUtils } from "./utility/api";
import { AddEditFavorite } from "./pages/Favorites/AddEditFavorite";
import { QueueDetails } from "./pages/SQS/QueueDetails";
import { StackResources } from "./pages/CloudFormation/StackResources";
import { TopicDetails } from "./pages/SNS/TopicDetails";
import { S3Home } from "./pages/S3/S3";
import { BucketPrefixNavigator } from "./pages/S3/BucketPrefixNavigator";


export const AppRouter = () => {
    const { region, environment } = useContext(GlobalContext) as GlobalContextType;

    const router = createBrowserRouter([
        {
            path: "/",
            element: <App />,
            errorElement: <ErrorPage />,
            children: [
                {
                    path: "/",
                    element: <Home />,
                },
                {
                    path: "/favorites",
                    element: <Outlet />,
                    children: [
                        {
                            path: "",
                            element: <Favorites />
                        },
                        {
                            path: "add",
                            element: <AddEditFavorite />
                        },
                        {
                            path: "edit/:id",
                            element: <AddEditFavorite />
                        }
                    ]
                },
                {
                    path: "/lambda",
                    element: <LambdaHome />
                },
                {
                    path: "/lambda/:functionName",
                    element: <FunctionDetail />
                },
                {
                    path: "/cloudformation",
                    element: <CloudFormationHome />
                },
                {
                    path: "/cloudformation/:stackId",
                    element: <StackResources />
                },
                {
                    path: "/cloudformation/exports",
                    element: <CloudFormationExports />
                },
                {
                    path: "/sns",
                    element: <SNSHome />
                },
                {
                    path: "/sns/:topicArn",
                    element: <TopicDetails />
                },
                {
                    path: "/sqs",
                    element: <SQSHome />
                },
                {
                    path: "/sqs/:queueUrl",
                    element: <QueueDetails />
                },
                {
                    path: "/cloudwatchlogs",
                    element: <CloudWatchLogsHome />,
                },
                {
                    path: "/cloudwatchlogs/loginsights",
                    element: <LogInsights />
                },
                {
                    path: "/cloudwatchlogs/:logGroupName",
                    element: <LogStreams />
                },
                {
                    path: "/cloudwatchlogs/:logGroupName/:logStreamName",
                    element: <LogEvents />
                },
                {
                    path: "/dynamodb",
                    element: <DynamoDBHome />
                },
                {
                    path: "/dynamodb/:tableName",
                    element: <TableDetailsLoader />,
                    loader: async ({ params }) => {
                        const response = await APIUtils.getCachedData({
                            method: 'POST',
                            url: '/aws/DynamoDB/DescribeTable',
                            environment: environment,
                            region: region,
                            body: {
                                TableName: params.tableName
                            }
                        });

                        return response.data;
                    }
                },
                {
                    path: "/secretsmanager",
                    element: <SecretsManagerHome />
                },
                {
                    path: "/secretsmanager/:secretId",
                    element: <ViewSecret />
                },
                {
                    path: "/s3",
                    element: <S3Home />
                },
                {
                    path: "/s3/:bucketName/*",
                    element: <BucketPrefixNavigator />
                },
                {
                    path: "*",
                    element: <ErrorPage />
                }
            ]
        }
    ]);

    return (
        <RouterProvider router={router} />
    )
}