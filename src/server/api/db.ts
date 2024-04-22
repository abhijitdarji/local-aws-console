import { Router, Request, Response } from "express";
import { join } from 'path';
import fs from 'fs';

interface DBSchema {
    [key: string]: { [key: string]: any }[] | undefined;
};

class JsonFileDb<DBSchema> {
    data: DBSchema;
    filePath: string;
    constructor(filePath: string, defaultData: DBSchema) {
        this.data = defaultData;
        this.filePath = filePath;
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        } else {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            this.data = JSON.parse(fileContents);
        }
    }

    ensureSelectorsForAllResources(data: DBSchema) {
        Object.keys(data as any).forEach((key: string) => {
            const resourceArr = data[key as keyof DBSchema] as { [key: string]: any }[];
            if (Array.isArray(resourceArr)) {
                resourceArr.forEach((item: any) => {
                    this.ensureSelector(item, key as keyof DBSchema);
                });
            }
        });
    }

    ensureSelector(data: any, resourceKey: keyof DBSchema) {
        if (!data.hasOwnProperty('id')) {

            // get the last id in the array
            const resource = this.data[resourceKey] as { [key: string]: any }[];
            const lastId = resource?.reduce((max: number, item: any) => {
                return item.id > max ? item.id : max;
            }, 0);

            data.id = lastId ? lastId + 1 : 1;
        }

        return data;
    }

    write() {
        this.ensureSelectorsForAllResources(this.data);
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    getItemById(arrayKey: keyof DBSchema, id: number) {
        const resource = this.data[arrayKey] as { [key: string]: any }[];

        if (Array.isArray(resource)) {
            return resource.find((item) => item.id === id);
        }

        return null;
    }

    updateItemById(arrayKey: keyof DBSchema, id: number, updatedItem: any) {
        const array = this.data[arrayKey] as { [key: string]: any }[];

        if (Array.isArray(array)) {
            const index = array.findIndex((item) => item.id === id);

            if (index !== -1) {
                const item = array[index];
                const updated = { ...item, ...updatedItem, id };
                array[index] = updated;
                this.write();
                return updated;
            }
        }

        return false;
    }

    deleteItemById(arrayKey: keyof DBSchema, id: number) {
        const array = this.data[arrayKey] as any[];

        if (Array.isArray(array)) {
            const index = array.findIndex((item) => item.id === id);

            if (index !== -1) {
                array.splice(index, 1);
                this.write();
                return true;
            }
        }

        return false;
    }
}

const dbPath = process.env.NODE_ENV === 'production' ? '../config/db.json' : '../../../config/db.json';

const db = new JsonFileDb<DBSchema>(join(__dirname, dbPath), {
    favorites: []
});

const router = Router();

router.get('/db/:resource', (req: Request, res: Response) => {
    const resource = req.params.resource.trim();
    res.json(db.data[resource as keyof DBSchema] || []);
});

router.get('/db/:resource/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const resource = req.params.resource.trim();
    const item = db.getItemById(resource, id);
    if (item) {
        res.json(item);
    } else {
        res.status(404).send({ error: "Item not found" });
    }
});

router.post('/db/:resource', (req: Request, res: Response) => {
    const newItem = req.body;
    const resource = req.params.resource.trim();

    if (!newItem || Object.keys(newItem).length === 0) {
        res.status(400).send({ error: "Missing item in request body" });
        return;
    }

    const resourceData = db.data[resource as keyof DBSchema] || [];
    resourceData.push(newItem);
    db.data[resource as keyof DBSchema] = resourceData;
    db.write();
    res.json(newItem);
});

router.patch('/db/:resource/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const resource = req.params.resource.trim();
    const updateNeeded = req.body;

    if (!updateNeeded || Object.keys(updateNeeded).length === 0) {
        res.status(400).send({ error: "Missing item in request body" });
        return;
    }

    const updatedItem = db.updateItemById(resource, id, updateNeeded);

    if (updatedItem) {
        res.json(updatedItem);
    } else {
        res.status(404).send({ error: "Item not found" });
    }
});

router.delete('/db/:resource/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const resource = req.params.resource.trim();

    if (db.deleteItemById(resource, id)) {
        res.status(204).send();
    } else {
        res.status(404).send({ error: "Item not found" });
    }
});


export { router };