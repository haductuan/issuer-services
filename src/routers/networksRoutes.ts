import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { NetworkController } from "../controllers/NetworkController.js";

export class NetWorkRoutes {
    public router: Router;
    public authenController = new AuthenController();
    public networksController = new NetworkController();
    constructor() {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("", this.networksController.createNewNetwork);
        this.router.get("", this.networksController.getAllNetworks);
        this.router.get("/:networkId", this.networksController.getNetworkById);
        this.router.put("/:networkId", this.networksController.updateNetworkConfig);
        this.router.delete("/:networkId", this.networksController.removeNetwork);

    }
}