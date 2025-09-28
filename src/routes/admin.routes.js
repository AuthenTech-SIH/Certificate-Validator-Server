import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyJWT_forRefreshToken } from "../middlewares/authAdmin.middleware.js";
import * as adminController from "../controllers/admin.controller.js";
import { refreshAccessToken } from "../controllers/admin-refresh-token.controller.js"

const router = Router();

router.route("/register").post(upload.none(), adminController.registerAdmin);

router.route("/login").post(upload.none(), adminController.loginAdmin);

router.route("/logout").post(verifyJWT, adminController.logoutAdmin);

router.route("/deleteAdmin").delete(verifyJWT, adminController.deleteAdmin);

router.route("/update").patch(verifyJWT, upload.none(), adminController.updateAdmin);

router.route("/getPendingUniversities").get(verifyJWT, adminController.getPendingUniversities);

router.route("/viewUniversityProfile/:universityId").get(verifyJWT, adminController.viewUniversityProfile);

router.route("/acceptUniversity/:universityId").patch(verifyJWT, adminController.acceptUniversity);

router.route("/rejectUniversity/:universityId").patch(verifyJWT, adminController.rejectUniversity);

router.route("/callUniversity/:universityId").patch(verifyJWT, adminController.callUniversity);

router.route("/refreshToken").post(upload.none(), verifyJWT_forRefreshToken, refreshAccessToken)


export default router;