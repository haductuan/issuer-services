import {
    EDDSA,
    Hash0,
    Hash1,
    Hasher,
    SnarkField,
    db,
    params as zidenjsParams,
} from "@zidendev/zidenjs";
export class GlobalVariables {
    public static hasher: Hasher;
    public static F: SnarkField;
    public static hash0: Hash0;
    public static hash1: Hash1;
    public static hashFunction: {
        (left: BigInt, right: BigInt): BigInt;
    };
    public static eddsa: EDDSA;
    public static levelDb: {
        [key: string]: {
            authsDb: db.SMTLevelDb;
            claimsDb: db.SMTLevelDb;
            claimRevDb: db.SMTLevelDb;
        };
    };

    public static KYCIssuer: string;
    public static KYCRegistry: string;

    constructor() { }

    public static async init(): Promise<void> {
        await zidenjsParams.setupParams();
        let params = zidenjsParams.getZidenParams();
        GlobalVariables.hasher = params.hasher;
        GlobalVariables.F = params.F;
        GlobalVariables.hash0 = params.hash0;
        GlobalVariables.hash1 = params.hash1;
        GlobalVariables.eddsa = params.eddsa;
        GlobalVariables.hashFunction = params.fmtHash;
        GlobalVariables.levelDb = {};
        GlobalVariables.KYCIssuer = "123";
        GlobalVariables.KYCRegistry = "123";

    }
}
