import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { createNetwork, updateNetwork, removeNetwork, getNetworkById, getAllNetworks } from "../services/Network.js";
export class NetworkController {
    public async createNewNetwork(req: Request, res: Response) {
        try {

            const { networkId, name, shotName } = req.body;
            if (!networkId || !name || !shotName || typeof (networkId) != "number" || typeof (name) != "string" || typeof (shotName) != "string") {
                throw ("invalid input")
            }
            const network = await createNetwork(networkId, name, shotName);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, network, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getAllNetworks(req: Request, res: Response) {
        try {
            const allNetworks = await getAllNetworks();
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, allNetworks, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getNetworkById(req: Request, res: Response) {
        try {
            const { networkId } = req.params;
            if (!networkId || typeof (networkId) != "number") {
                throw ("invalid networkId");
            }
            const network = await getNetworkById(networkId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, network, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async updateNetworkConfig(req: Request, res: Response) {
        try {
            const { networkId } = req.params;
            if (!networkId || typeof (networkId) != "number") {
                throw ("invalid networkId");
            }

            const { name, shotName } = req.body;
            if (!name || !shotName || !networkId || typeof (name) != "string" || typeof (shotName) != "string" || typeof (networkId) != "string") {
                throw ("invalid input");
            }
            const network = await updateNetwork(networkId, name, shotName);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, network, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async removeNetwork(req: Request, res: Response) {
        try {
            const { networkId } = req.params;
            if (!networkId || typeof (networkId) != "number") {
                throw ("invalid networkId");
            }
            
            await removeNetwork(networkId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}