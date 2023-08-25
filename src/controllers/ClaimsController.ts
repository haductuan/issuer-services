import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getChallengePublishAllClaims, getChallengeRevokeAllPendingRevoke, getCombinesChallenge as getCombineChallenge } from "../services/Challenge.js";
import { changeLockTreeState, checkLockTreeState } from "../services/TreeState.js";
import { serializaData, serializaDataClaim } from "../util/utils.js";
import { SignedChallenge } from "@zidendev/zidenjs";
import { publishAndRevoke, publishOnly, revokeOnly } from "../services/PublishAndRevokeClaim.js";
import { createClaim, getClaimByClaimId, getClaimStatus, getEntryData, getNonRevQueryMTPInput, getQueryMTPInput, holderGetAllClaim, queryClaim, queryClaimAndRawData, saveClaim, saveEntryData, setRevokeClaim } from "../services/Claim.js";
import { ClaimStatus, ProofTypeQuery } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import { checkProof, getRegistryRequirement } from "../services/RegistryService.js";
import { verifyTokenAdmin } from "../services/Authen.js";
import { UploadedFile } from "../middlewares/UploadMiddleware.js";

export class ClaimsController {
    public async queryClaim(req: Request, res: Response) {
        try {
            let { issuerId, status, holderId, schemaHash, claimId } = req.query;
            if (!issuerId) {
                issuerId = "";
            }
            if (!status) {
                status = [];
            }
            if (typeof status == "string") {
                status = [status];
            }
            if (!holderId) {
                holderId = "";
            }
            if (!schemaHash) {
                schemaHash = "";
            }
            if (!claimId) {
                claimId = [];
            }
            if (typeof claimId == "string") {
                claimId = [claimId];
            }

            if (typeof issuerId != "string" || typeof holderId != "string" || typeof schemaHash != "string") {
                throw ("Invalid query input");
            }

            const claims = await queryClaim(issuerId, status as string[], holderId, schemaHash, claimId as string[]);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, claims, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async generateProof(req: Request, res: Response) {
        try {
            const id = req.params["claimId"];
            const type = req.query["type"];
            if (!id) {
                throw ("Invalid claimId!");
            }

            if (type != ProofTypeQuery.MTP && type != ProofTypeQuery.NON_REV_MTP) {
                throw ("Invalid type");
            }

            const claim = await getClaimByClaimId(id);

            if (claim.status != ClaimStatus.ACTIVE) {
                throw ("Claim is not ACTIVE");
            }

            let queryResponse = {};
            const checkLock = await checkLockTreeState(claim.issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }

            if (type == ProofTypeQuery.MTP) {
                queryResponse = await getQueryMTPInput(claim.issuerId, claim.hi);
            }

            if (type == ProofTypeQuery.NON_REV_MTP) {
                queryResponse = await getNonRevQueryMTPInput(claim.issuerId, claim.revNonce);
            }

            res.status(200).send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, queryResponse, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getClaimStatus(req: Request, res: Response) {
        try {
            const { claimId } = req.params;
            if (!claimId || typeof claimId != "string") {
                throw ("Invalid claimId");
            }
            const claimStatus = await getClaimStatus(claimId);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, { status: claimStatus }, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async retrieveClaim(req: Request, res: Response) {
        try {
            const { claimId } = req.params;
            if (!claimId || typeof claimId != "string") {
                throw ("Invalid claimId");
            }

            const data = await getEntryData(claimId);
            res.status(200).send(data);

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async requestNewClaim(req: Request, res: Response) {
        try {
            let { holderId, registryId, data } = req.body;
            const { issuerId } = req.params;

            const requirement = await getRegistryRequirement(registryId);
            if (requirement.length != 0) {
                let { zkProofs } = req.body;
                if (!zkProofs) {
                    throw ("Need ZKPs to attest requirement!");
                }

                if (!Array.isArray(zkProofs) && typeof zkProofs == 'string') {
                    if (zkProofs[0] != '[')
                        zkProofs = '[' + zkProofs + ']';
                }

                if (typeof zkProofs == 'string') {
                    zkProofs = JSON.parse(zkProofs);
                } else {
                    if (Array.isArray(zkProofs)) {
                        for (let i = 0; i < zkProofs.length; i++) {
                            if (typeof zkProofs[i] == 'string') {
                                zkProofs[i] = JSON.parse(zkProofs[i]);
                            }
                        }
                    }
                }
                const attestResult = await checkProof(zkProofs, registryId);
                if (!attestResult) {
                    throw ("Attest requirement failed!");
                }
            }

            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }

            if (!holderId || !registryId || !data
                || typeof holderId != "string" || typeof registryId != "string") {
                throw ("Invalid data");
            }

            if (typeof data == 'string') {
                data = JSON.parse(data);
            }

            const { claim, schemaHash } = await createClaim(data, holderId, registryId);
            const claimId = await saveClaim(claim, schemaHash, holderId, issuerId, registryId, ClaimStatus.REVIEWING);

            let imagesUrl = [];
            if (req.files != null) {
                const file = (req.files as UploadedFile)['fileUpload'];
                if (file != undefined) {
                    for (let i = 0; i < file.length; i++) {
                        imagesUrl.push(file[i].filename);
                    }
                }
            }

            await saveEntryData(claimId, claim, data, imagesUrl);

            res.send({ claimId: claimId, rawData: data, claim: serializaDataClaim(claim) });
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async issueListClaims(req: Request, res: Response) {
        try {
            let claimResponse: Array<any> = [];
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }

            for (let i = 0; i < req.body.length; i++) {
                try {
                    const { holderId, registryId, data } = req.body[i];
                    if (!holderId || !registryId || !data
                        || typeof holderId != "string" || typeof registryId != "string") {
                        throw ("Invalid data");
                    }

                    const { claim, schemaHash } = await createClaim(data, holderId, registryId);
                    const claimId = await saveClaim(claim, schemaHash, holderId, issuerId, registryId, ClaimStatus.PENDING);

                    await saveEntryData(claimId, claim, data, []);

                    claimResponse.push(
                        {
                            index: i,
                            claimId: claimId
                        }
                    );

                } catch (err: any) {
                    const error = (buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
                    claimResponse.push(
                        {
                            index: i,
                            err: error
                        }
                    );
                }
            }
            res.status(200).send(claimResponse);
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeListClaims(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (issuerId == undefined || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }

            const { revNonces } = req.body;

            if (revNonces == undefined || revNonces.length == 0) {
                throw ("Required array revNonces to revoke");
            }
            revNonces.forEach((revNonce: any) => {
                if (typeof revNonce != "number") {
                    throw ("revNonces must be array number");
                }
            });
            const claims = await setRevokeClaim(revNonces, issuerId);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, { claims: claims }, ResultMessage.APISUCCESS.message))
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getPublishChallenge(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getChallengePublishAllClaims(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getRevokeChallenge(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getChallengeRevokeAllPendingRevoke(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getCombineChallenge(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getCombineChallenge(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishClaims(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const { signature } = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw ("Invalid signature");
            }
            const signChallenge: SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const response = await publishOnly(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, { status: response }, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeClaims(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const { signature } = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw ("Invalid signature");
            }
            const signChallenge: SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const response = await revokeOnly(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, { status: response }, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishAndRevokeClaims(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw ("Invalid issuerId");
            }
            const { signature } = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw ("Invalid signature");
            }
            const signChallenge: SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw ("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const response = await publishAndRevoke(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, { status: response }, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw (err);
            }

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async updateReviewingClaim(req: Request, res: Response) {
        try {
            const { claimId, status } = req.params;
            if (!claimId || typeof claimId != "string") {
                throw ("Invalid claimId");
            }
            if (status != ClaimStatus.PENDING && status != ClaimStatus.REJECT) {
                throw ("Status must PENDING or REJECT")
            }
            const claim = await Claim.find({ "id": claimId, "status": ClaimStatus.REVIEWING });
            if (claim.length == 0) {
                throw ("Claim not REVIEWING");
            }
            for (let i = 0; i < claim.length; i++) {
                claim[i].status = status;
                await claim[i].save();
            }
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, { claimId: claimId, status: status }, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getRawClaim(req: Request, res: Response) {
        try {
            const { issuerId } = req.params;
            const token = req.headers.authorization;
            if (!issuerId) {
                throw ("Invalid issuer")
            }
            if (!token) {
                throw ("Invalid token");
            }
            const verifyToken = await verifyTokenAdmin(token, issuerId);
            if (!verifyToken) {
                throw ("Invalid token");
            }

            let { status, holderId, schemaHash, claimId } = req.query;
            if (!status) {
                status = [];
            }
            if (typeof status == "string") {
                status = [status];
            }
            if (!holderId) {
                holderId = "";
            }
            if (!schemaHash) {
                schemaHash = "";
            }
            if (!claimId) {
                claimId = [];
            }
            if (typeof claimId == "string") {
                claimId = [claimId];
            }

            if (typeof issuerId != "string" || typeof holderId != "string" || typeof schemaHash != "string") {
                throw ("Invalid query input");
            }
            const claims = await queryClaimAndRawData(issuerId, status as string[], holderId, schemaHash, claimId as string[]);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, claims, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async holderRetrieveAllClaim(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const claimEncode = await holderGetAllClaim(userId);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, claimEncode, ResultMessage.APISUCCESS.message)
            )

        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

}