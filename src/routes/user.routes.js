import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser,   
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
router.route("/change-password").post(verifyToken,changePassword)
router.route("/current-user").get(verifyToken,getCurrentUser)


export default router;