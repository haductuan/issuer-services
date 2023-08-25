import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getKYCRegistryInfor, registerDIDToContract, resolveDID } from "../services/KYCRegistry.js";

export class KYCController {
    public async getKYCRegistry(req: Request, res: Response) {
        try {
            const response = await getKYCRegistryInfor();
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, response, ResultMessage.APISUCCESS.message)
            );

        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async registerID(req: Request, res: Response) {
        try {
            const { userId, pubkeyX, pubkeyY, publicKey } = req.body;
            if (typeof userId != 'string' || typeof pubkeyX != 'string' || typeof pubkeyY != 'string' || typeof publicKey != 'string') {
                throw ('Invalid data');
            }

            await registerDIDToContract(userId, pubkeyX, pubkeyY, publicKey);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, { userId: userId, pubkeyX: pubkeyX, pubkeyY: pubkeyY, publicKey: publicKey }, ResultMessage.APISUCCESS.message))
        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async readDID(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            if (!userId || typeof userId != 'string') {
                throw ('Invalid userId');
            }

            const didResolve = await resolveDID(userId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, didResolve, ResultMessage.APISUCCESS.message))

        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}