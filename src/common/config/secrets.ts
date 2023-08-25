import dotenv from 'dotenv';
import process from 'process';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ISSUER_SERVER";
export const JWT_SECRET = process.env.JWT_SECRET ?? "random@123";
export const PASSWORD = process.env.PASSWORD ?? "password@123";
export const STATE_ADDRESS = process.env.STATE_ADDRESS ?? "0x0";
export const DID_REGISTRY_ADDRESS = process.env.DID_REGISTRY_ADDRESS ?? "0x0";
export const RPC_PROVIDER = process.env.RPC_PROVIDER ?? "https://data-seed-prebsc-1-s1.binance.org:8545/"
export const isProduction = process.env.NODE_ENV == "production";
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "debug";
export const LOG_OUTPUT = process.env.LOG_OUTPUT ?? "dev";
export const ZIDEN_SERVER_URI = process.env.ZIDEN_SERVER_URI ?? "http://localhost:5000";
export const PUBKEYX = process.env.PUBKEYX ?? "0";
export const PUBKEYY = process.env.PUBKEYY ?? "0";
export const PRIVATEKEY = process.env.PRIVATEKEY ?? "0";

export const AUTHEN_SERVER = process.env.AUTHEN_SERVER ?? "http://localhost:3001"; 
export const ISSUER_SERVER = process.env.ISSUER_SERVER?? "http://localhost:3000";

export const MULTER_STORAGE_DEST = process.env.MULTER_STORAGE_DEST ?? './uploads';
export const KYC_PRIVATE_KEY = process.env.KYC_PRIVATE_KEY ?? "123456789";
export const PROOF_VALID_TIME = Number(process.env.PROOF_VALID_TIME ?? "86400000");
export const QUERY_MTP_VALIDATOR = process.env.QUERY_MTP_VALIDATOR ?? "0x0";