import axios from "axios";
import { v4 } from "uuid";
import { ZIDEN_SERVER_URI } from "../common/config/secrets.js";
import Claim from "../models/Claim.js";
import Issuer from "../models/Issuer.js";
import Network from "../models/Network.js";
import Schema from "../models/Schema.js";
import SchemaRegistry, { IRequirement } from "../models/SchemaRegistry.js";
import { utils as zidenjsUtils, query as zidenjsQuery, schema as zidenjsSchema } from "@zidendev/zidenjs";
import { parseBigInt } from "../util/utils.js";
import { getPrimitiveSchema, getSchemaBySchemaHash } from "./Schema.js";

export async function createNewRegistry(schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, networkId: number, endpointUrl: string, requirements: Array<IRequirement>) {    
    if (!schemaHash) {
        schemaHash = "";
    }

    if (!issuerId) {
        issuerId = "";
    }

    if (!description) {
        description = "";
    }

    if (!updateble) {
        updateble = false;
    }

    if (networkId == undefined || networkId == null) {
        networkId = 0;
    }

    if (!endpointUrl) {
        endpointUrl = "";
    }

    if (!expiration) {
        expiration = 0;
    }

    const schema = await Schema.findOne({"@hash": schemaHash});
    let schemaName = "";
    if (schema) {
        schemaName = schema["@name"];
    }

    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("issuerId not exist!");
    }
    
    const networkSchema = await Network.findOne({networkId: networkId});
    let networkName = "";
    if (networkSchema && networkSchema.name != undefined) {
        networkName = networkSchema.name;
    }

    const newRegistry = new SchemaRegistry({
        id: v4(),
        schemaHash: schemaHash,
        issuerId: issuerId,
        description: description,
        expiration: expiration,
        updatable: updateble,
        endpointUrl: endpointUrl,
        isActive: true,
        networkId: networkId,
        requirements: requirements
    });

    await newRegistry.save();
    return {
        id: newRegistry.id,
        schema: {
            name: schemaName,
            hash: schemaHash
        },
        issuerId: issuerId,
        description: description,
        expiration: expiration,
        updatable: updateble,
        endpointUrl: endpointUrl,
        isActive: true,
        network: {
            networkId: networkId,
            name: networkName
        },
        requirements: requirements
    };
}

export async function findSchemaRegistry(schemaHash: string, issuerId: string, networkId: number) {
    let query: any = {};
    if (schemaHash != "") {
        query["schemaHash"] = schemaHash;
    }

    if (issuerId != "") {
        query["issuerId"] = issuerId;
    }

    if (networkId != 0) {
        query["networkId"] = networkId;
    }

    const registries = await SchemaRegistry.find(query);
    const response: Array<any> = [];

    for (let i = 0; i < registries.length; i++) {
        let registry = registries[i];

        const numClaims = await Claim.countDocuments({"schemaRegistryId": registry.id});
        let network;
        network = await Network.findOne({networkId: registry.networkId});
        const schema = await Schema.findOne({"@hash": registry.schemaHash});

        if (network == undefined) {
            network = {
                networkId: 97,
                name: 'bnb testnet'
            }
        }

        response.push({
            id: registry.id,
            schema: {
                name: schema!["@name"],
                hash: schema!["@hash"]
            },
            issuerId: registry.issuerId,
            description: registry.description,
            expiration: registry.expiration,
            updatable: registry.updatable,
            network: {
                networkId: network!.networkId ?? 97,
                name: network!.name ?? 'bnb testnet'
            },
            endpointUrl: registry.endpointUrl,
            isActive: registry.isActive,
            numClaims: numClaims,
            requirements: registry.requirements
        });
    }

    return response;
}

export async function updateRegistry(registryId: string, schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, networkId: number, endpointUrl: string) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("registryId not exist!");
    }

    const schema = await Schema.findOne({"@hash": schemaHash});
    if (!schema) {
        throw("schemaHash not exist!");
    }

    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("issuerId not exist!");
    }

    const network = await Network.findOne({networkId: networkId});
    if (!network) {
        throw("networkId not exist!");
    }

    if (expiration == 0) {
        expiration = 10*365*24*60*60*60*1000;
    }
    
    registry.schemaHash = schemaHash;
    registry.issuerId = issuerId;
    registry.description = description;
    registry.expiration = expiration;
    registry.updatable = updateble;
    registry.networkId = networkId;
    registry.endpointUrl = endpointUrl;

    await registry.save();
    return registry;
}

export async function changeStatusRegistry(registryId: string, status: boolean) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("registryId not exist!");
    }

    registry.isActive = status;
    await registry.save();
    return registry;
}

export async function getRegistryRequirement(registryId: string) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("registry not exist!");
    }

    if (!registry.requirements) {
        return [];
    } else {
        return registry.requirements;
    }
}

type Proof = {
    proof: any,
    publicData: Array<string>
}

export async function checkProof(zkProofs: Array<Proof>, registryId: string) {
    try {
        const requirements = await getRegistryRequirement(registryId);
        for (let i = 0; i < requirements.length; i++) {
            const requirement = requirements[i];
            let proofRequirement = false;

            for (let j = 0; j < zkProofs.length; j++) {
                const schemaHash = BigInt(zkProofs[i].publicData[7]).toString(10);
                const issuerId = BigInt(zkProofs[i].publicData[4]).toString(16);
                const deterministicValue = zkProofs[i].publicData[10];
                const operator = zkProofs[i].publicData[9];
                const value = zidenjsQuery.calculateDeterministicValue(parseBigInt(requirement.query.value), 6, requirement.query.operator).toString(10);

                if (schemaHash != requirement.schemaHash
                    || !requirement.allowedIssuers.includes(issuerId)
                    || operator != requirement.query.operator.toString()
                    || value != deterministicValue)
                {
                    continue;
                } else {
                    try {
                        const schema = await getPrimitiveSchema(schemaHash);
                        const schemaPropertiesSlot = zidenjsSchema.schemaPropertiesSlot(schema);
                        if (schemaPropertiesSlot[requirement.query.propertyName] == undefined) {
                            continue;
                        }
                        const slotIndex = schemaPropertiesSlot[requirement.query.propertyName].slot;
                        if (slotIndex.toString() != zkProofs[i].publicData[8]) {
                            continue;
                        }
                        const begin = schemaPropertiesSlot[requirement.query.propertyName].begin;
                        const end = schemaPropertiesSlot[requirement.query.propertyName].end;
                        const mask = zidenjsUtils.createMask(begin, end);
                        if (mask.toString() != zkProofs[i].publicData[11]) {
                            continue;
                        }
                    } catch (err: any) {
                    }

                    proofRequirement = true;
                    break;
                }
            }
            if (!proofRequirement) {
                return false;
            }
        }

        const response = (await axios.request({
            url: `${ZIDEN_SERVER_URI}/api/v1/proofs/verify`,
            method: 'post',
            data: {
                networkId: "97",
                zkProofs: zkProofs
            }
        })).data;

        if (response.isValid == true) {
            return true;
        } else {
            return false;
        }

    } catch (err: any) {
        console.log(err)
        return false;
    }
}

export async function getRegistryById(registryId: string) {
    const registry = await SchemaRegistry.findOne({
        id: registryId
    });

    if (!registry) {
        throw("Registry not existed!");
    }


    const schema = await Schema.findOne({"@hash": registry.schemaHash});
    let schemaName = "";
    if (schema) {
        schemaName = schema["@name"];
    }

    await registry.save();
    return {
        id: registry.id,
        schema: {
            name: schemaName,
            hash: registry.schemaHash
        },
        issuerId: registry.issuerId,
        description: registry.description,
        expiration: registry.expiration,
        updatable: registry.updatable,
        endpointUrl: registry.endpointUrl,
        isActive: true,
        network: {
            networkId: 97,
            name: 'bnb testnet'
        },
        requirements: registry.requirements
    };
}