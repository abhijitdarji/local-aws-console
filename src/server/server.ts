import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env.development' });
}

import express, { json, Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { router as appSettingsRoutes, environments } from './api/app-settings';
import { router as awsRoutes } from './api/aws';
import { router as dbRoutes } from './api/db';
import cors from 'cors';

const PORT = process.env.VITE_PORT || 3000;

const app = express();

// enable cors
app.use(cors());

// serve the client app
app.use('/', express.static(join(__dirname, 'public')))

app.use(json());

// add middleware to get environment from header and set it to process.env.ENVIRONMENT
app.use((req: Request, res: Response, next: NextFunction) => {

    // skip this middleware if the request is for the app settings
    if (req.path.startsWith('/api/app')) {
        next();
        return;
    }

    if (req.headers["x-api-environment"]) {

        const allenv = environments.sso.concat(environments.key);

        const env = allenv.filter((env: string) => env.toLowerCase() === req.headers["x-api-environment"]?.toString().toLowerCase());

        if (env.length === 0) {
            res.status(400).send('Invalid environment header');
            return;
        }

        process.env.ENVIRONMENT = env[0];
        process.env.PROFILE = env[0];
        process.env.PROFILE_TYPE = environments.sso.includes(env[0]) ? 'sso' : 'key';
        next();
    }
    else {
        res.status(400).send('Missing environment header');
    }

    process.env.REGION = req.headers["x-api-region"]?.toString() || 'us-east-1';
});


app.use('/api/app', appSettingsRoutes);
app.use('/api/app', dbRoutes);
app.use('/api/aws', awsRoutes);


app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});