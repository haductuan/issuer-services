import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    "@name": {
        type: String,
        required: true
    },
    "@type": {
        type: String,
        required: true
    },
    "@id": {
        type: String,
        required: true
    },
    "@hash": {
        type: String
    },
    "@context": {
        type: [String]
    },
    "@required": {
        type: [String]
    }
}, {
    strict: false
})

export default mongoose.model("Schema", Schema);