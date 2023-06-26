import { Router } from "express";
import { KYCController } from "../controllers/KYCController.js";

export class KYCRoutes {
    public router: Router;
    public kYCController = new KYCController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.get("/kyc", this.kYCController.getKYCRegistry);
        this.router.post("", this.kYCController.registerID);
        this.router.get("/resolve/:userId", this.kYCController.readDID);
    }
}