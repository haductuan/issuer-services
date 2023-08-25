import mongoose from "mongoose";

const ProofRequest = new mongoose.Schema({
    id: String,
    registryId: String,
    challenge: String,
    valid: Number
});

export default mongoose.model("ProofRequest", ProofRequest);