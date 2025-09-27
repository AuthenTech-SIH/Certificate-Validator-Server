import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as universityController from "../controllers/university.controller.js";

const router = Router();

router.route("/register").post(upload.none(), universityController.registerUniversity);

router.route("/login").post(upload.none(), universityController.loginUniversity);

router.route("/logout").post(verifyJWT, universityController.logoutUniversity);

// yh route ek baar check krr lena ki isme verifyJWT and upload.none() cahiye ya ni
router.route("/check-status").get(universityController.checkUniversityStatus)

router.route("/update").patch(verifyJWT, upload.none(), universityController.updateUniversity)

router.route("/delete-university").delete(verifyJWT, universityController.deleteUniversity)

router.route("/upload-list-of-students-passing").post(verifyJWT, upload.single("file"), universityController.uploadListOfStudentsPassing);


export default router;