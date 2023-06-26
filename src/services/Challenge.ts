import { GlobalVariables } from "../common/config/global.js";
import { ClaimStatus } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import { getIssuer } from "./Issuer.js";
import { cloneDb, closeLevelDb, restoreDb } from "./LevelDbManager.js";
import { getTreeState } from "./TreeState.js";
import { utils as zidenjsUtils } from "@zidendev/zidenjs";

export async function getPublishChallenge(claimIds: Array<string>, issuerId: string): Promise<BigInt> {

    const claims = await Claim.find({"id": {$in: claimIds}, "status": ClaimStatus.PENDING, "issuerId": issuerId});
    if (claims.length == 0) {
        return BigInt(0);
    }

    let issuerTree = await getTreeState(issuerId);
    try {
        let issuer = await getIssuer(issuerId);

        await cloneDb(issuer.pathDb!);
        const hihv: [ArrayLike<number>, ArrayLike<number>][] = claims.map(claim => {
            return [GlobalVariables.F.e(claim.hi!), GlobalVariables.F.e(claim.hv!)];
        });
    
        const oldState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
    
        await issuerTree.batchInsertClaimByHiHv(hihv);
        await issuerTree.batchRevokeClaim([]);
    
        const newState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
        const challenge = GlobalVariables.F.toObject(GlobalVariables.hasher([oldState, newState]));
    
        await restoreDb(issuer.pathDb!);
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        
        return challenge;
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
    
    
}

export async function getRevokeChallenge(claimIds: Array<string>, issuerId: string): Promise<BigInt> {
    const claims = await Claim.find({"id": {$in: claimIds}, "status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    if (claims.length == 0) {
        return BigInt(0);
    }
    let issuerTree = await getTreeState(issuerId);
    try {
        let issuer = await getIssuer(issuerId);

        await cloneDb(issuer.pathDb!);
        const revNonces: Array<BigInt> = [];
        claims.forEach(claim => {
            if (claim.revNonce != undefined) {
                revNonces.push(BigInt(claim.revNonce));
            }
        });
    
        const oldState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
    
        await issuerTree.batchInsertClaimByHiHv([]);
        await issuerTree.batchRevokeClaim(revNonces);
    
        const newState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
        const challenge = GlobalVariables.F.toObject(GlobalVariables.hasher([oldState, newState]));
    
        await restoreDb(issuer.pathDb!);
        
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return challenge;
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}


export async function getPublishAndRevkeChallenge(claimIdsPublish: Array<string>, claimIdsRevoke: Array<string>, issuerId: string): Promise<BigInt> {

    const claimsPublish = await Claim.find({"id": {$in: claimIdsPublish}, "status": ClaimStatus.PENDING, "issuerId": issuerId});

    const claimsRevoke = await Claim.find({"id": {$in: claimIdsRevoke}, "status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    if (claimsRevoke.length == 0 && claimsPublish.length == 0) {
        return BigInt(0);
    }
    let issuerTree = await getTreeState(issuerId);
    try {

        let issuer = await getIssuer(issuerId);


        await cloneDb(issuer.pathDb!);
        const revNonces: Array<BigInt> = [];
        claimsRevoke.forEach(claim => {
            if (claim.revNonce != undefined) {
                revNonces.push(BigInt(claim.revNonce));
            }
        });
    
        const hihv: [ArrayLike<number>, ArrayLike<number>][] = claimsPublish.map(claim => {
            return [GlobalVariables.F.e(claim.hi!), GlobalVariables.F.e(claim.hv!)];
        });
    
        const oldState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
    
        await issuerTree.batchInsertClaimByHiHv(hihv);
        await issuerTree.batchRevokeClaim(revNonces);
    
        const newState = zidenjsUtils.bitsToNum(issuerTree.getIdenState());
        const challenge = GlobalVariables.F.toObject(GlobalVariables.hasher([oldState, newState]));
    
        await restoreDb(issuer.pathDb!);
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return challenge;
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function getChallengePublishAllClaims(issuerId: string) {
    const claims = await Claim.find({"status": ClaimStatus.PENDING, "issuerId": issuerId});
    const claimIds: Array<string> = claims.map(claim => {
        return claim.id!;
    });
    const challenge = await getPublishChallenge(claimIds, issuerId);
    return challenge;
}

export async function getChallengeRevokeAllPendingRevoke(issuerId: string) {
    const claims = await Claim.find({"status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    const claimIds: Array<string> = claims.map(claim => {
        return claim.id!;
    });
    const challenge = await getRevokeChallenge(claimIds, issuerId);
    return challenge;
}

export async function getCombinesChallenge(issuerId: string) {
    const claimsPublish = await Claim.find({"status": ClaimStatus.PENDING, "issuerId": issuerId});
    const claimIdsPublish: Array<string> = claimsPublish.map(claim => {
        return claim.id!;
    });

    const claimsRevoke = await Claim.find({"status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    const claimIdsRevoke: Array<string> = claimsRevoke.map(claim => {
        return claim.id!;
    });
    const challenge = await getPublishAndRevkeChallenge(claimIdsPublish, claimIdsRevoke, issuerId);
    return challenge;
}