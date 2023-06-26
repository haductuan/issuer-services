import { OPERATOR } from "@zidendev/zidenjs";
import mongoose from "mongoose";
export interface IQuery {
    propertyName: string,
    operator: OPERATOR,
    value: number[]
}

export interface IRequirement {
    title: string,
    attestation: string,
    allowedIssuers: string[],
    schemaHash: string,
    query: IQuery
}

export type IService = {
    _id?: string,
    name: string,
    verifierId: string,
    description: string,
    networkId: string,
    requirements: IRequirement[],
    endpointUrl: string,
    active: boolean
}

const QuerySchema = new mongoose.Schema<IQuery>({
    propertyName: { type: String, required: true },
    operator: { type: Number, required: true },
    value: { type: [Number], required: true }
}, {
    strict: true,
    timestamps: false,
    _id: false
});

const RequirementSchema = new mongoose.Schema<IRequirement>({
    title: { type: String, required: true },
    attestation: { type: String, required: true },
    allowedIssuers: { type: [String], required: true },
    schemaHash: { type: String, required: true },
    query: { type: QuerySchema, required: true },
}, {
    strict: true,
    timestamps: false,
    _id: false
});
export interface ISchemaRegistry {
    id: string,
    schemaHash: string,
    issuerId: string,
    description: string,
    expiration: number,
    updatable: boolean,
    networkId: number,
    endpointUrl: string,
    isActive: boolean,
    requirements: IRequirement[]
}

const SchemaRegistry = new mongoose.Schema<ISchemaRegistry>({
    id: String,
    schemaHash: String,
    issuerId: String,
    description: String,
    expiration: Number,
    updatable: Boolean,
    networkId: Number,
    endpointUrl: String,
    isActive: Boolean,
    requirements: [RequirementSchema]
});

export default mongoose.model("SchemaRegistry", SchemaRegistry);