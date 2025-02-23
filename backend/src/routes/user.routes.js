import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, sendVerifyOtp, verifyEmail, sendResetOtp, isAuthenticated,   
    } from "../controllers/user.controllers.js"; 
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), registerUser
)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyToken,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(changePassword)
router.route("/current-user").get(verifyToken,getCurrentUser)
router.route("/send-verify-otp").post(verifyToken,sendVerifyOtp)
router.route("/is-auth").post(verifyToken,isAuthenticated)
router.route("/verify-account").post(verifyToken,verifyEmail)
router.route("/send-reset-otp").post(sendResetOtp)



export default router;