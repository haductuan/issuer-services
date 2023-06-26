import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { IssuerController } from "../controllers/IssuersController.js";

export class IssuerRoutes {
    public router: Router;
    public issuerController = new IssuerController();
    public authenController = new AuthenController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("/register", this.issuerController.registerIssuer);
        this.router.put("/:issuerId/restore-last-state", this.authenController.authorizationAdmin, this.issuerController.restoreLastState);
        this.router.post("/:issuerId/operators", this.authenController.authorizationAdmin, this.issuerController.addNewOperator);
        this.router.delete("/:issuerId/operators/:operatorId", this.authenController.authorizationAdmin, this.issuerController.deleteOperator);
        this.router.get("/:issuerId/operators/:operatorId", this.issuerController.getOperatorInfor);
        this.router.get("/:issuerId/operators", this.issuerController.getListOperator);
        this.router.get("/:issuerId/profile", this.issuerController.getIssuerInfor);
        this.router.get("", this.issuerController.getAllIssuerId);
        this.router.get("/:issuerId/lastest-state", this.issuerController.getAuthenPath);
    
    }
}