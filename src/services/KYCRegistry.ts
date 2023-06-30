import { ethers } from "ethers";
import { GlobalVariables } from "../common/config/global.js";
import { DID_REGISTRY_ADDRESS, RPC_PROVIDER } from "../common/config/secrets.js";
import SchemaRegistry from "../models/SchemaRegistry.js";
import fs from "fs-extra"

export async function getKYCRegistryInfor() {
    const issuerId = GlobalVariables.KYCIssuer;
    const registryId = GlobalVariables.KYCRegistry;
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("KYC Registry not existed!");
    }

    const schemaHash = registry.schemaHash;

    return {
        issuerId: issuerId,
        registryId: registryId,
        schemaHash: schemaHash
    }
}

export async function registerDIDToContract(userId: string, pubkeyX: string, pubkeyY: string, publicKey: string) {
    try {
        const provider = new ethers.providers.JsonRpcBatchProvider(RPC_PROVIDER);
        const secret = JSON.parse(fs.readFileSync("secret.json", "utf-8"))
        const wallet = new ethers.Wallet(secret.pk, provider);    
        const didRegistryABI = JSON.parse(fs.readFileSync("src/abis/Registry.json", "utf-8"));
        const didRegistry = new ethers.Contract(DID_REGISTRY_ADDRESS, didRegistryABI, provider);

        const userDID = BigInt('0x' + userId);
        const userPublicKey = BigInt('0x' + publicKey);
        const userPubkeyX = BigInt(pubkeyX);
        const userPubkeyY = BigInt(pubkeyY);

        const registerDID = await didRegistry.connect(wallet).functions.registerDID(userDID, userPubkeyX, userPubkeyY, userPublicKey, { gasPrice: 15000000000, gasLimit: 30000000 });
        const tx = await registerDID.wait();
        console.log(tx.events[0].event == "DIDRegister");
        if (tx.events[0].event == "DIDRegister") {
            return true;
        }
        return false;
    } catch (err) {
        console.log(err);
        return false;
    }
}

export async function resolveDID(userId: string) {
    try {
        const provider = new ethers.providers.JsonRpcBatchProvider(RPC_PROVIDER);
        const didRegistryABI = JSON.parse(fs.readFileSync("src/abis/Registry.json", "utf-8"));
        const didRegistry = new ethers.Contract(DID_REGISTRY_ADDRESS, didRegistryABI, provider);

        const userDID = BigInt('0x' + userId);
        const did = await didRegistry.readDID(userDID);

        const id = BigInt(did.id.toString()).toString(16);
        const pubkeyX = BigInt(did.pubkeyX.toString()).toString();
        const pubkeyY = BigInt(did.pubkeyY.toString()).toString();
        let publicKey = BigInt(did.publicKey.toString()).toString(16);
        while(publicKey.length < 64) {
            publicKey = '0' + publicKey;
        }
        return {
            userId: id, 
            pubkeyX: pubkeyX, 
            pubkeyY: pubkeyY, 
            publicKey: publicKey
        }

    } catch (err: any) {
        console.log(err);
        return {
            userId: userId, 
            pubkeyX: '0', 
            pubkeyY: '0', 
            publicKey: '0'
        }
    }
}