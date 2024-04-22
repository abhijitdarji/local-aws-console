import { Router } from 'express';
import aws from './aws-sdk-manager';

const router = Router()

router.post('/:serviceName/:commandName', async (req, res) => {

    const serviceName = req.params.serviceName;
    const commandName = req.params.commandName;
    const options = req.body;
    const fetchAllPages = req.query.fetchAllPages === 'true' ? true : false;

    if (aws.serviceLibraries[serviceName] === undefined) {
        res.status(400).json({ error: `Unsupported service ${serviceName}` });
        return;
    }

    const service = await aws.getService(serviceName);

    if (!service[`${commandName.replace('Command','')}Command`]) {
        res.status(400).json({ error: `Unsupported command ${commandName}` });
        return;
    }

    try {
        const data = await aws.callAWSService(serviceName, commandName, options, fetchAllPages);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

export { router }