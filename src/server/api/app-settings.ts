import { Router, Request, Response } from "express";
import ConfigParser from 'configparser';
import * as os from 'os';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromIni } from "@aws-sdk/credential-providers";
import config from 'config';


const REGIONS = config.get('ENABLED_REGIONS');
const configParser = new ConfigParser();
const credentialsParser = new ConfigParser();
const awsDir = `${os.homedir()}/.aws`;

configParser.read(`${awsDir}/config`);
const awsConfig = configParser.sections();

credentialsParser.read(`${awsDir}/credentials`);
const credentials = credentialsParser.sections();

const ssoCreds = awsConfig.filter(section => Object.keys(configParser.items(section)).includes('sso_account_id'));
const keyCreds = awsConfig.filter(section => {
    let keys = Object.keys(configParser.items(section));
    return (keys.includes('aws_access_key_id') && keys.includes('aws_secret_access_key'))
        || (keys.includes('role_arn') && keys.includes('source_profile'));
})
    .concat(credentials.filter(section => {
        let keys = Object.keys(credentialsParser.items(section));
        return (keys.includes('aws_access_key_id') && keys.includes('aws_secret_access_key'))
            || (keys.includes('role_arn') && keys.includes('source_profile'));
    }
    ));

const localProfile = awsConfig.filter(section => section.replace('profile', '').trim() === 'local')[0];
const localCreds = localProfile ? configParser.items(localProfile) : {};

let environments = {
    sso: ssoCreds.map(section => section.replace('profile ', '')).sort(),
    key: keyCreds.map(section => section.replace('profile ', '')).sort()
}

const getCallerIdentity = async (profile: string) => {

    const client = new STSClient({ region: 'us-east-1', credentials: fromIni({ profile: profile }) })

    const command = new GetCallerIdentityCommand({})
    const response = await client.send(command).catch((err) => {
        console.error(err)
    })

    return response;
}


const router = Router();

router.get('/settings/environments', (_req: Request, res: Response) => {

    res.json(environments);
});


router.get('/settings/environments/:name/validate', async (req: Request, res: Response) => {

    const { name } = req.params;

    if (!name) {
        res.status(400).send('Missing required fields');
        return;
    }

    const allenv = environments.sso.concat(environments.key);
    const env = allenv.filter((env) => env === name);

    if (env.length === 0) {
        res.status(400).send('Environment does not exist');
        return;
    }

    const identity = await getCallerIdentity(env[0]);

    res.json(identity);

});


router.get('/settings/regions', (_req: Request, res: Response) => {

    res.json(REGIONS);
});


export { router, environments, localCreds };