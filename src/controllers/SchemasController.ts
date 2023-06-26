import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { createNewSchema, getAllSchema, getPrimitiveSchema, getSchemaBySchemaHash } from "../services/Schema.js";

export class SchemasController {
    public async createNewSchema(req: Request, res: Response) {
        try {
            const schema = req.body;
            
            const response = await createNewSchema(schema);
            
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, response, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getAllSchemas(req: Request, res: Response) {
        try {
            const schemas = await getAllSchema();
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, schemas, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getSchemaBySchemaHash(req: Request, res: Response) {
        try {
            const {schemaHash} = req.params;
            if (!schemaHash || typeof schemaHash != "string") {
                throw("Invalid schemaHash");
            }

            // const schema = await getSchemaBySchemaHash(schemaHash);
            const schema = await getSchemaBySchemaHash(schemaHash);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, schema, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getPrimativeSchemaBySchemaHash(req: Request, res: Response) {
        try {
            const {schemaHash} = req.params;
            if (!schemaHash || typeof schemaHash != "string") {
                throw("Invalid schemaHash");
            }

            // const schema = await getSchemaBySchemaHash(schemaHash);
            const schema = await getPrimitiveSchema(schemaHash);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, schema, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}