import mongoose from "mongoose";

const Claim = new mongoose.Schema({
    id: String,
    hi: String,
    hv: String,
    schemaHash: String,
    expiration: Number,
    updatable: Boolean,
    version: Number,
    revNonce: Number,
    createAt: Number,
    status: String,
    userId: String,
    proofType: String,
    issuerId: String,
    schemaRegistryId: String
});

export default mongoose.model("Claim", Claim);