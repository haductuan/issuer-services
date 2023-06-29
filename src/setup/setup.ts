import { GlobalVariables } from "../common/config/global.js";
import { KYC_PRIVATE_KEY, ISSUER_SERVER } from "../common/config/secrets.js";
import Issuer from "../models/Issuer.js";
import { utils as zidenjsUtils } from "@zidendev/zidenjs";
import { registerIssuer } from "../services/TreeState.js";
import fs from "fs-extra";
import { createNewSchema } from "../services/Schema.js";
import { createNewRegistry } from "../services/RegistryService.js";
import SchemaRegistry from "../models/SchemaRegistry.js";
import libsodium from "libsodium-wrappers";
import { registerDIDToContract, resolveDID } from "../services/KYCRegistry.js";
import { getSchemaHashFromSchema } from "../util/utils.js";
import Schema from "../models/Schema.js";

export async function setupKYCIssuer() {
    try {
        let privateKey = KYC_PRIVATE_KEY;
        const privateKey2Buf = zidenjsUtils.hexToBuffer(privateKey, 32);

        const pubkeyX = GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(privateKey2Buf)[0]).toString(10);
        const pubkeyY = GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(privateKey2Buf)[1]).toString(10);

        const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
        if (!issuer) {
            const newIssuer = await registerIssuer(pubkeyX, pubkeyY);
            GlobalVariables.KYCIssuer = newIssuer.issuerId;

            await libsodium.ready;
            while(privateKey.length < 64) {
                privateKey = "0" + privateKey;
            }
            const resolve = await resolveDID(GlobalVariables.KYCIssuer);
            if (resolve.publicKey == "0") {
                const publicKey = libsodium.crypto_scalarmult_base(libsodium.from_hex(privateKey), "hex");
                await registerDIDToContract(GlobalVariables.KYCIssuer, pubkeyX, pubkeyY, publicKey);    
            }
        } else {
            GlobalVariables.KYCIssuer = issuer.issuerId!;
        }

    } catch (err) {
        console.log(err);
    }

}

export async function setupSchemaRegistry() {
    try {
        const registry = await SchemaRegistry.findOne({issuerId: GlobalVariables.KYCIssuer});
        if (!registry) {
            const vnidSchema = JSON.parse(fs.readFileSync('src/setup/schema.json', 'utf-8'));
            
            try {
                await createNewSchema(vnidSchema);
            } catch (err) {
            }

            let schema = await Schema.findOne({"@hash": getSchemaHashFromSchema(vnidSchema)})

            const newRegistry = await createNewRegistry(
                schema!["@hash"]!,
                GlobalVariables.KYCIssuer,
                `${schema!["@name"]}`,
                300*24*60*60*60*1000,
                true,
                97,
                `${ISSUER_SERVER}/api/v1`,
                []
            );
            GlobalVariables.KYCRegistry = newRegistry.id;
        } else {
            GlobalVariables.KYCRegistry = registry.id;
        }

    } catch (err) {
        console.log(err);
    }
}

