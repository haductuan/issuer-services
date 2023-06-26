import mongoose from "mongoose";

const Issuer = new mongoose.Schema({
    issuerId: String,
    authHi: String,
    pubkeyX: String,
    pubkeyY: String,
    pathDb: String
});

export default mongoose.model("Issuer", Issuer);