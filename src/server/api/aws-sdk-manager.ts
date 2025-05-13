/// <reference path="../environment.d.ts" />

import { fromIni, fromSSO } from '@aws-sdk/credential-providers';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { localCreds } from './app-settings';

class AwsSDKManager {

    #serviceLibraries: { [key: string]: string };
    #serviceObjects: { [key: string]: any };
    #serviceClients: { [key: string]: Map<string, any> };

    constructor() {
        this.#serviceLibraries = {
            APIGateway: '@aws-sdk/client-api-gateway',
            CloudFormation: '@aws-sdk/client-cloudformation',
            CloudWatchLogs: '@aws-sdk/client-cloudwatch-logs',
            Cognito: '@aws-sdk/client-cognito-identity',
            DynamoDB: '@aws-sdk/client-dynamodb',
            ECS: '@aws-sdk/client-ecs',
            IAM: '@aws-sdk/client-iam',
            Lambda: '@aws-sdk/client-lambda',
            S3: '@aws-sdk/client-s3',
            SecretsManager: '@aws-sdk/client-secrets-manager',
            SNS: '@aws-sdk/client-sns',
            SQS: '@aws-sdk/client-sqs',
            STS: '@aws-sdk/client-sts',
        };
        this.#serviceObjects = {};
        this.#serviceClients = {};
    }

    get serviceLibraries() {
        return this.#serviceLibraries;
    }

    async getService(serviceName: string) {

        if (this.#serviceObjects[serviceName]) return this.#serviceObjects[serviceName];

        let serviceLib = this.#serviceLibraries[serviceName];
        if (!serviceLib) throw new Error(`Unsupported service ${serviceName}`);

        serviceLib = await import(serviceLib);
        this.#serviceObjects[serviceName] = serviceLib;
        return serviceLib;
    }

    async getClient(serviceName: string, profile: string, profileType: string, region: string) {

        if (this.#serviceClients[serviceName] && this.#serviceClients[serviceName].get(`${profile}:${region}`)) return this.#serviceClients[serviceName].get(`${profile}:${region}`);

        const service = await this.getService(serviceName);
        const profileCreds = profile.startsWith("local") ? localCreds.find((cred: any) => cred.name === profile)?.creds : {};
        const credentials = profileType === 'sso' ? fromSSO({ profile: profile }) : fromIni({ profile: profile });
        const client = new service[`${serviceName}Client`]({ 
            region: region, 
            credentials: credentials,
            ...profile.startsWith("local")   ? { endpoint: profileCreds?.["endpoint_url"] ?? "http://localhost:4566" } : {} 
        });
        if (!this.#serviceClients[serviceName]) this.#serviceClients[serviceName] = new Map();
        this.#serviceClients[serviceName].set(`${profile}:${region}`, client);
        return client;
    }

    async checkProfileSessionIsValid(profile: string, profileType: string) {
        const client = await this.getClient('STS', profile, profileType, process.env.REGION);
        const command = new GetCallerIdentityCommand({});
        const response = await client.send(command).catch((err: { message: string | string[]; }) => {
            if (err.message.indexOf('Token is expired') !== -1) {
                throw new Error('SSO token expired');
            }
        });
        return response;
    }


    async callAWSService(serviceName: string, commandName: string, options: any, fetchAllPages = false) {

        // await this.checkProfileSessionIsValid(process.env.PROFILE, process.env.PROFILE_TYPE);

        const service = await this.getService(serviceName);

        const client = await this.getClient(serviceName, process.env.PROFILE, process.env.PROFILE_TYPE, process.env.REGION);
        const commandString = commandName.indexOf('Command') > 0 ? commandName.substring(0, commandName.indexOf('Command')) : commandName;
        const command = `${commandString}Command`;
        const paginateCommand = `paginate${commandString}`;

        if (!service[command]) throw new Error(`Unsupported command ${commandName}`);
        if (fetchAllPages && !service[paginateCommand]) throw new Error(`Command ${commandName} does not support pagination`);

        try {
            if (fetchAllPages) {
                const paginator = service[paginateCommand];
                let result: { [key: string]: any } = {};
                for await (const page of paginator({ client }, options)) {
                    const data = Object.keys(page).filter(key => Array.isArray(page[key]))[0];
                    if (!result[data]) result[data] = [];
                    if (page[data].length === 0) continue;
                    result[data].push(...page[data]);
                }
                return result;
            } else {
                const commandInstance = new service[command](options);
                const data = await client.send(commandInstance);
                return data;
            }

        } catch (error) {
            console.error('Error executing command:', error);
            throw error;
        }
    }
}

const aws = new AwsSDKManager();
export default aws;