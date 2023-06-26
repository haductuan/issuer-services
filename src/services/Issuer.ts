import { auth } from "@zidendev/zidenjs";
import { PUBKEYX, PUBKEYY } from "../common/config/secrets.js";
import { ClaimStatus } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import Issuer from "../models/Issuer.js";
import Operator from "../models/Operator.js";

export async function saveIssuer(issuerId: string, authHi: string, pubkeyX: string, pubkeyY: string, pathDb: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            authHi: authHi,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb
        });
        await issuer.save();
    } else {
        throw("Issuer is existed!");
    }
}

export async function getIssuer(issuerId: string) {
    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("Issuer is not existed");
    } else {
        return {
            issuerId: issuer.issuerId,
            authHi: issuer.authHi,
            pubkeyX: issuer.pubkeyX,
            pubkeyY: issuer.pubkeyY,
            pathDb: issuer.pathDb
        }
    }
}

export async function updateIssuer(issuerId: string, authHi: string , pubkeyX: string, pubkeyY: string, pathDb: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            authHi: authHi,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb
        });
        await issuer.save();
    } else {
        checkIssuer.pathDb = pathDb;
        checkIssuer.authHi = authHi;
        checkIssuer.pubkeyX = pubkeyX;
        checkIssuer.pubkeyY = pubkeyY;
        await checkIssuer.save();
    }
}

export async function getIssuerIdByPublicKey(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        throw("Issuer is not exist!");
    }
    return issuer.issuerId!;
}

export async function checkIssuerExisted(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        return false;
    } else {
        return true;
    }
}

export async function getAuthenIssuerId() {
    const issuer = await Issuer.findOne({pubkeyX: PUBKEYX, pubkeyY: PUBKEYY});
    return issuer?.issuerId;
}

export async function getIssuerInfor(issuerId: string) {
    const numPublishClaims = await Claim.countDocuments({"issuerId": issuerId, status: ClaimStatus.ACTIVE});
    const numHolders = (await Claim.aggregate([{"$match": {"issuerId": issuerId}}, {"$group": {_id: "$userId"}}])).length;
        
    return {
        issuerId: issuerId,
        numPublishClaims: numPublishClaims,
        numHolders: numHolders
    }
}

export async function getAllIssuer(operatorId: string) {
    if (operatorId == '') {
        const issuers = await Issuer.find();
        let listIssuer: Array<any> = [];
        for (let i = 0; i < issuers.length; i++) {
            const ans = await getIssuerInfor(issuers[i].issuerId!);
            listIssuer.push(ans);
        }
        return listIssuer;
    } else {
        const operators = await Operator.find({userId: operatorId});
        const issuerIdList: string[] = [];
        operators.forEach(operator => {
            if (operator.issuerId != undefined) {
                issuerIdList.push(operator.issuerId);
            }
        });

        const issuers = await Issuer.find({'issuerId': {'$in': issuerIdList}});
        let listIssuer: Array<any> = [];
        for (let i = 0; i < issuers.length; i++) {
            const ans = await getIssuerInfor(issuers[i].issuerId!);
            listIssuer.push(ans);
        }
        return listIssuer;
    }    
}