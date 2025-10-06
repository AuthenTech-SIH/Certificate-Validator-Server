import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as universityController from "../controllers/university.controller.js";

const router = Router();

// Yha iss baar shyd upload.none() na lge. Check this out
router.route("/SPOC-register").post(universityController.SPOCRegister);

router.route("/SPOC-verify").post(universityController.SPOCVerify);

router.route("/create-password").post(universityController.createPassword);

router.route("/check-status").get(universityController.checkStatus);

router.route("/login").post(universityController.login);

router.route("/logout").post(verifyJWT, universityController.logout);

router.route("/complete-university-profile").post(verifyJWT, upload.any(), universityController.completeUniversityProfile);


export default router;