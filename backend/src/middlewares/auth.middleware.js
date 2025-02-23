import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer", "")
        if (!token) {
            res.status(500).json({success: false, message:"Unauthorised access"})
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if (!user) {
            res.status(500).json({success: false, message: "Unauthorised access"})
        }
    
        req.user = user
        next()
    } catch (error) {
        res.status(500).json({success: false, message: error?.message})
    }
})