import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as universityController from "../controllers/university.controller.js";

const router = Router();

router.route("/health").get((req, res) => {
    res.status(200).json({ message: "Server is ready" });
});

// Yha iss baar shyd upload.none() na lge. Check this out
router.route("/SPOC-register").post(upload.none(), universityController.SPOCRegister);

router.route("/SPOC-verify").post(upload.none(), universityController.SPOCVerify);

router.route("/create-password").post(upload.none(), universityController.createPassword);

router.route("/check-status").get(upload.none(), universityController.checkStatus);

router.route("/login").post(upload.none(), universityController.login);

router.route("/logout").post(verifyJWT, upload.none(), universityController.logout);

router.route("/complete-university-profile").post(verifyJWT, upload.any(), universityController.completeUniversityProfile);


export default router;