import mongoose from "mongoose";

const Entry = new mongoose.Schema({
    claimId: String,
    entry: [String],
    rawData: String,
    imagesUrl: [String]
})

export default mongoose.model("Entry", Entry);