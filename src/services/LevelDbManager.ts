import { dbPath, levelDbSrc, levelDbSrcClone, levelDbStateBackup } from "../common/config/constant.js";
import fs from "fs-extra"

import {db as zidenjsDb} from "@zidendev/zidenjs";
import { GlobalVariables } from "../common/config/global.js";

export async function createNewLevelDb(id: string) {
    try {
        const pathLevelDb = dbPath + "/" + id;
        fs.removeSync(pathLevelDb);
        if (GlobalVariables.levelDb[pathLevelDb] == undefined) {
            const claimsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/claims`);
            const claimRevDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/claimRev`);
            const authsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/auths`);
            GlobalVariables.levelDb[pathLevelDb] = {
                "claimsDb": claimsDb,
                "claimRevDb": claimRevDb,
                "authsDb": authsDb
            }
        }
        else {
            if (GlobalVariables.levelDb[pathLevelDb]["claimsDb"] == undefined) {
                const claimsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/claims`);
                GlobalVariables.levelDb[pathLevelDb]["claimsDb"] = claimsDb;
            }
            if (GlobalVariables.levelDb[pathLevelDb]["claimRevDb"] == undefined) {
                const claimRevDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/claimRev`);
                GlobalVariables.levelDb[pathLevelDb]["claimRevDb"] = claimRevDb;
            }
            if (GlobalVariables.levelDb[pathLevelDb]["authsDb"] == undefined) {
                const authsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/auths`);
                GlobalVariables.levelDb[pathLevelDb]["authsDb"] = authsDb;
            }
        }
    
        // const claimsDb = GlobalVariables.levelDb[pathLevelDb]["claimsDb"];
        // const revocationDb = GlobalVariables.levelDb[pathLevelDb]["revocationDb"];
        // const rootsDb = GlobalVariables.levelDb[pathLevelDb]["rootsDb"];
        
        // return {pathLevelDb, claimsDb, revocationDb, rootsDb};
        return pathLevelDb;
    } catch (err: any) {
        throw (err);
    }
}

export async function closeLevelDb(claimsDb: zidenjsDb.SMTLevelDb, claimRevDb: zidenjsDb.SMTLevelDb, authsDb: zidenjsDb.SMTLevelDb) {
    try {
        // await claimsDb.nodes.close();
        // await revocationDb.nodes.close();
        // await rootsDb.nodes.close();
    } catch (err: any) {
        console.log(err);
    }
    
}

export async function openLevelDb(src: string) {
    // console.log(src);

    if (GlobalVariables.levelDb[src] == undefined) {
        const claimsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claims`);
        const claimRevDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claimRev`);
        const authsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/auths`);
        GlobalVariables.levelDb[src] = {
            "claimsDb": claimsDb,
            "claimRevDb": claimRevDb,
            "authsDb": authsDb
        }
    }
    else {
        if (GlobalVariables.levelDb[src]["claimsDb"] == undefined) {
            const claimsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claims`);
            GlobalVariables.levelDb[src]["claimsDb"] = claimsDb;
        }
        if (GlobalVariables.levelDb[src]["claimRevDb"] == undefined) {
            const claimRevDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claimRev`);
            GlobalVariables.levelDb[src]["claimRevDb"] = claimRevDb;
        }
        if (GlobalVariables.levelDb[src]["authsDb"] == undefined) {
            const authsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/auths`);
            GlobalVariables.levelDb[src]["authsDb"] = authsDb;
        }
    }

    // const claimsDb = GlobalVariables.levelDb[src]["claimsDb"];
    // const revocationDb = GlobalVariables.levelDb[src]["revocationDb"];
    // const rootsDb = GlobalVariables.levelDb[src]["rootsDb"];
    // return {claimsDb, revocationDb, rootsDb};
    
}

export async function copyDb(src: string, des: string) {
    try {
        fs.removeSync(des);
        fs.copySync(src, des);
    } catch (err: any) {
        throw(err);
    }
}

export async function cloneDb(path: string) {
    copyDb(path + "/" + levelDbSrc, path + "/" + levelDbSrcClone);
}

export async function restoreDb(path: string) {
    await close_db(path);
    copyDb(path + "/" + levelDbSrcClone, path + "/" + levelDbSrc);
    await open_db(path);
}

export async function backupLastState(path: string) {
    copyDb(path + "/" + levelDbSrc, path + "/" + levelDbStateBackup);
}

export async function restoreLastStateTratition(path: string) {
    await close_db(path);
    copyDb(path + "/" + levelDbStateBackup, path + "/" + levelDbSrc);
    await open_db(path);
}

export async function close_db(src: string) {
    try {
        await GlobalVariables.levelDb[src].claimsDb.nodes.close();
    } catch(err) {
        console.log(err)
    }
    try {
        await GlobalVariables.levelDb[src].claimRevDb.nodes.close();
    } catch(err) {
        console.log(err)
    }
    try {
        await GlobalVariables.levelDb[src].authsDb.nodes.close();
    } catch(err) {
        console.log(err)
    }
}

export async function open_db(src: string) {
    GlobalVariables.levelDb[src]["claimsDb"] = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claims`);
    GlobalVariables.levelDb[src]["claimRevDb"] = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claimRev`);
    GlobalVariables.levelDb[src]["authsDb"] = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/auths`);
    try {
        await GlobalVariables.levelDb[src].claimsDb.nodes.open();
    } catch (err: any) {
        console.log("claims");
    }
    try {
        await GlobalVariables.levelDb[src].claimRevDb.nodes.open();
    } catch (err: any) {
        console.log("claimRev");
    }
    try {
        await GlobalVariables.levelDb[src].authsDb.nodes.open();
    } catch (err: any) {
        console.log("auths");
    }
}