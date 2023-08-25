import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { ClaimsController } from "../controllers/ClaimsController.js";
import { UploadMiddleWare } from "../middlewares/UploadMiddleware.js";

export class ClaimsRouters {
    public router: Router;
    public authenController = new AuthenController();
    public claimsController = new ClaimsController();
    public uploadFile = new UploadMiddleWare();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.get("", this.claimsController.queryClaim);
        this.router.get("/:claimId/proof", this.claimsController.generateProof);
        this.router.get("/:claimId/status", this.claimsController.getClaimStatus);
        this.router.get("/:claimId/retrieve", this.claimsController.retrieveClaim);
        this.router.post("/request/:issuerId", this.uploadFile.uploadPublic, this.claimsController.requestNewClaim);
        this.router.post("/issue/:issuerId", this.authenController.authorization, this.claimsController.issueListClaims);
        this.router.post("/revoke-list/:issuerId", this.authenController.authorization, this.claimsController.revokeListClaims);
        this.router.get("/publish-challenge/:issuerId", this.authenController.authorization, this.claimsController.getPublishChallenge);
        this.router.get("/revoke-challenge/:issuerId", this.authenController.authorization, this.claimsController.getRevokeChallenge);
        this.router.get("/combined-challenge/:issuerId", this.authenController.authorization, this.claimsController.getCombineChallenge);
        this.router.post("/publish/:issuerId", this.authenController.authorizationAdmin, this.claimsController.publishClaims);
        this.router.post("/revoke/:issuerId", this.authenController.authorizationAdmin, this.claimsController.revokeClaims);
        this.router.post("/combined/:issuerId", this.authenController.authorizationAdmin, this.claimsController.publishAndRevokeClaims);
        this.router.put("/:issuerId/:claimId/status/:status", this.authenController.authorization, this.claimsController.updateReviewingClaim);
        this.router.get("/:issuerId/raw-data", this.authenController.authorizationAdmin, this.claimsController.getRawClaim);
        this.router.get("/:userId/retrieve-data", this.claimsController.holderRetrieveAllClaim);
    }
}