import Network from "../models/Network.js";

export async function checkNetworkExisted(networkId: number): Promise<boolean> {
    const lastNetwork = await Network.findOne({
        networkId: networkId
    });

    if (lastNetwork) {
        return true;
    } else {
        return false;
    }
}

export async function createNetwork(networkId: number, name: string, shotName: string) {
    const isNetworkExisted = await checkNetworkExisted(networkId);
    if (isNetworkExisted) {
        throw ("Network is existed")
    }
    const network = new Network({
        networkId: networkId,
        createAt: Number(Date.now()),
        name: name,
        shotName: shotName,
        updateAt: Number(Date.now())
    })
    await network.save();
    return {
        networkId: network.networkId,
        createAt: network.createAt,
        name: network.name,
        shotname: network.shotName,
        updateAt: network.updateAt
    }
}

export async function updateNetwork(networkId: number, name: string, shotName: string) {
    const lastNetwork = await Network.findOne({ networkId: networkId })
    if (!lastNetwork) {
        throw ("Network is not existed")
    }
    else {
        lastNetwork.name = name;
        lastNetwork.shotName = shotName;
        lastNetwork.updateAt = Number(Date.now());
        await lastNetwork.save();
        return {
            networkId: lastNetwork.networkId,
            createAt: lastNetwork.createAt,
            name: lastNetwork.name,
            shotname: lastNetwork.shotName,
            updateAt: lastNetwork.updateAt
        }
    }
}

export async function removeNetwork(networkId: string) {
    const lastNetwork = await Network.findOne({ networkId: networkId })
    if (!lastNetwork) {
        throw ("Network is not existed")
    }
    else {
        await lastNetwork.remove();
    }
}

export async function getNetworkById(networkId: string) {
    const network = await Network.findOne({ networkId: networkId })
    if (!network) {
        throw ("Network is not existed")
    }
    else {
        return {
            networkId: network.networkId,
            createAt: network.createAt,
            name: network.name,
            shotName: network.shotName,
            updateAt: network.updateAt
        }
    }
}

export async function getAllNetworks() {
    const allNetworks = await Network.find();
    if (!allNetworks) {
        throw ("No network exist")
    }
    else {
        return allNetworks.map(e => {
            return {
                networkId: e.networkId,
                createAt: e.createAt,
                name: e.name,
                shotName: e.shotName,
                updateAt: e.updateAt
            }
        })
    }
}