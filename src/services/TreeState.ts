import {utils as zidenjsUtils, state, smt, Auth, auth} from "@zidendev/zidenjs";
import Issuer from "../models/Issuer.js";
import TreeState from "../models/TreeState.js";
import { createNewLevelDb, openLevelDb, restoreDb } from "./LevelDbManager.js";
import { v4 } from "uuid";
import { OperatorType } from "../common/enum/EnumType.js";
import { checkIssuerExisted, getIssuer, updateIssuer } from "./Issuer.js";
import { checkOperatorExisted, saveNewOperator } from "./Operator.js";
import { GlobalVariables } from "../common/config/global.js";
import { registerNewIssuer } from "./Authen.js";
import { serializaData } from "../util/utils.js";

export async function saveTreeState(issuerTree: state.State) {
    const issuerId = zidenjsUtils.bufferToHex(issuerTree.userID);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        const newTree = new TreeState({
            revocationNonce: issuerTree.claimRevNonce,
            authRevNonce: issuerTree.authRevNonce,
            userID: issuerId,
            lastestRevocationNonce: issuerTree.claimRevNonce,
            lastestAuthRevNonce: issuerTree.authRevNonce,
            isLockPublish: false,
        });
        await newTree.save();
    } else {
        treeState.revocationNonce = issuerTree.claimRevNonce;
        treeState.authRevNonce = issuerTree.authRevNonce;
        await treeState.save();
    }
}

export async function saveLastStateTransistion(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        return;
    } else {
        treeState.lastestRevocationNonce = treeState.revocationNonce;
        treeState.lastestAuthRevNonce = treeState.authRevNonce;
        await treeState.save();
    }
}

export async function checkLockTreeState(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not existed");
    }
    if (treeState.isLockPublish == true) {
        return true;
    } else {
        return false;
    }
}

export async function changeLockTreeState(issuerId: string, lock: boolean) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not existed");
    }
    treeState.isLockPublish = lock;
    await treeState.save();
}

export async function getTreeState(issuerId: string) {
    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("IssuerId not exist!");
    }
    if (!issuer.pathDb) {
        throw("Invalid pathDb");
    }

    const issuerTreeState = await TreeState.findOne({userID: issuerId});
    if (!issuerTreeState) {
        throw("Issuer not exist");
    }

    await openLevelDb(issuer.pathDb);
    const src = issuer.pathDb;
    const authsTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].authsDb,
        await GlobalVariables.levelDb[src].authsDb.getRoot(),
        8
    );

    const claimRevTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].claimRevDb,
        await GlobalVariables.levelDb[src].claimRevDb.getRoot(),
        14
    );

    const claimsTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].claimsDb,
        await GlobalVariables.levelDb[src].claimsDb.getRoot(),
        14
    );

    const issuerTree = new state.State(
        authsTree,
        claimsTree,
        claimRevTree,
        issuerTreeState.authRevNonce!,
        issuerTreeState.revocationNonce!,
        8,
        14,
        zidenjsUtils.hexToBuffer(issuerId, 31)
    );

    return issuerTree;
}

export async function registerIssuer(pubkeyX: string, pubkeyY: string) {
    const isRegister = await checkIssuerExisted(pubkeyX, pubkeyY);
    if (isRegister) {
        throw("Issuer is registed!");
    }

    const id = v4();
    const pathLevelDb = await createNewLevelDb(id);
    try {
        const newIssuerAuth: Auth = {
            authHi: BigInt(0),
            pubKey: {
              X: BigInt(pubkeyX),
              Y: BigInt(pubkeyY),
            },
        };

        const newIssuerTree = await state.State.generateState(
            [newIssuerAuth],
            GlobalVariables.levelDb[pathLevelDb].authsDb,
            GlobalVariables.levelDb[pathLevelDb].claimsDb,
            GlobalVariables.levelDb[pathLevelDb].claimRevDb,
        );
                
        const issuerId = zidenjsUtils.bufferToHex(newIssuerTree.userID);
        
        const issuerRegisterResponse = await registerNewIssuer(issuerId);

        await updateIssuer(
            issuerId,
            newIssuerAuth.authHi.toString(10),
            pubkeyX,
            pubkeyY,
            pathLevelDb
        );
        await saveTreeState(newIssuerTree);
        
        const checkOperator = await checkOperatorExisted(issuerId!, issuerId!);
        if (!checkOperator) {
            await saveNewOperator(issuerId, OperatorType.ADMIN, issuerRegisterResponse.claimId, issuerId);
        }

        return {
            issuerId: issuerId,
            claimId: issuerRegisterResponse.claimId,
            version: issuerRegisterResponse.version,
            revNonce: issuerRegisterResponse.revNonce
        };
    } catch (err: any) {
        throw(err);
    }
}

export async function restoreLastStateTransition(issuerId: string) {
    const issuer = await getIssuer(issuerId);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not exist!");
    }

    await restoreDb(issuer.pathDb!);
    
    treeState.authRevNonce = treeState.lastestAuthRevNonce;
    // treeState.revocationNonce = treeState.lastestRevocationNonce;

    await treeState.save();
}

export async function getLastestAuthClaimPath(issuerId: string) {
    const issuer = await getIssuer(issuerId);
    const issuerTree = await getTreeState(issuerId);

    const rootsMatchProof = await issuerTree.generateRootsMatchProof();

    const proof = {
        claimsRoot: rootsMatchProof.claimsRoot,
        claimRevRoot: rootsMatchProof.claimRevRoot,
        expectedState: rootsMatchProof.expectedState
    };

    return JSON.parse(serializaData(proof));
}