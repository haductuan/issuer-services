import TreeState from "../models/TreeState.js";

export async function checkTreeLock(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId is not existed");
    }
    if (treeState.isLockPublish) {
        return true;
    } else {
        return false;
    }
}

export async function lockTree(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId is not existed");
    }
    treeState.isLockPublish = true;
    await treeState.save();
}

export async function unlockTree(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId is not existed");
    }
    treeState.isLockPublish = false;
    await treeState.save();
}