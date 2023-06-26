import mongoose from "mongoose";

const TreeState = new mongoose.Schema({
    revocationNonce: Number,
    authRevNonce: Number,
    userID: String,
    lastestRevocationNonce: Number,
    lastestAuthRevNonce: Number,
    isLockPublish: Boolean
});

export default mongoose.model("TreeState", TreeState);