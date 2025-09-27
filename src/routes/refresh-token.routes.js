import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT_forRefreshToken } from "../middlewares/auth.middleware.js"
import { refreshAccessToken } from "../controllers/refresh-token.controller.js"
import { Router } from "express"

const refreshTokenRouter = Router()

refreshTokenRouter.route("/refresh-token").post(upload.none(), verifyJWT_forRefreshToken, refreshAccessToken)

export default refreshTokenRouter