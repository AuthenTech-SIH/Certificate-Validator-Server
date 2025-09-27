import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/verify-certificate").post(upload.single("certificate"), studentController.verifyCertificate);   // handle the part where the certificate will be verified

router.route("/navigate/:student_id").get(studentController.navigateLink);  // handle the part where the link will naviagte us

export default router;