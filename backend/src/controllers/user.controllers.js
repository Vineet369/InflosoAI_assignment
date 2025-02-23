import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import transporter from "../utils/nodemailer.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        res.status(401).json({status: false, message: error?.message})
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {userName, email, signUpPassword, rememberMe} = req.body
    if ([userName, email, signUpPassword].some((entry) => {
        entry?.trim===""
    })){
        res.status(401).json({success: false, message: "Field cannot be empty"})
    }

    const existedUser = await User.findOne({
        $or:[{userName},{email}]
    })

    if (existedUser){
        res.status(401).json({success: false, message: "Email or username already registered"})
    }

    let coverImageFilePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageFilePath = req.files.coverImage[0].path;
    }

    const coverImage = await uploadOnCloudinary(coverImageFilePath)

    const user = await User.create({
        email,
        userName: userName.toLowerCase(),
        coverImage: coverImage?.url || "",
        password: signUpPassword
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        res.status(401).json({success: false, message:"Something went wrong while registering user!"})
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    if(rememberMe){
    
        const options = {
            httpOnly: true,
            secure: process.env.PROJECT_ENV === "production",
            sameSite: process.env.PROJECT_ENV === "production" ? "none" : "strict",
        }
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, createdUser, "User registration successful")
        )
    }else{
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, createdUser, "User registration successful")
        )
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password, rememberMe} = req.body

    if (!email){
        res.status(404).json({success: false, message:"Please provide valid email"})
    }

    const user = await User.findOne({email})
    if (!user) {
        res.status(404).json({success: false, message: "No registered user data found"})
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        res.status(401).json({success: false, message: "Invalid User Credentials"})
    }
    // console.log("user", user)
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.PROJECT_ENV === "production",
        sameSite: process.env.PROJECT_ENV === "production" ? "none" : "strict",
    }

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to ",
        text: `You have successfully logged in to _ via email ${email}`
    }

    // await transporter.sendMail(mailOptions)
    if(rememberMe){
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInUser, accessToken, refreshToken
                },
                "User login successful"
            )
        )    
    }else{
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInUser, accessToken, refreshToken
                },
                "User login successful"
            )
        )
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.PROJECT_ENV === "production",
        sameSite: process.env.PROJECT_ENV === "production" ? "none" : "strict",
      
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "User logged out"
    ))
})

const sendVerifyOtp = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user?._id)
        if (user.isAccountVerified) {
            return res.status(200).json(new ApiResponse(200, "user already verified"))
        }
    
        const otp = String(Math.floor( 1000 + Math.random() * 9000))

        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now() * 60 * 60 * 1000
        await user.save()

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification Required ",
            text: `In order to verify you account, use this otp ${otp} `
        }
        // await transporter.sendMail(mailOptions)

        return res
        .status(200)
        .json( new ApiResponse(
            200, 
            {},
            "Verification code sent via Email. Check your registered mail")
        )

    } catch (error) {
        res.status(500).json({success: false, message: error?.message})
}
})

const verifyEmail = asyncHandler(async (req, res) => {
    const {otp} = req.body

    if (!otp ) {
        res.status(404).json({success: false, message:"otp is required"})
    }
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            res.status(404).json({success: false, message: "User not found"})
        }

        if (user.verifyOtp === "" || user.verifyOtp !== otp){
            res.status(400).json({success: false, message: "Invalid Otp"})
        }

        if (user.verifyOtpExpireAt < Date.now()){
            res.status(400).json({success: false, message: "Otp expired!"})
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save()

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {}, 
            "Email verified successfully")
        )

    } catch (error) {
        res.status(500).json({success: false, message: error?.message})
    }

})

const sendResetOtp = asyncHandler(async (req, res) => {
    const {email} = req.body

    if (!email) {
        res.status(401).json({success: false, message: "Email is required"})
    }

    const user = await User.findOne({email})

    if (!user) {
        res.status(404).json({success: false, message: "No user found with this email"})
    }

    const otp = String(Math.floor( 1000 + Math.random() * 9000))

    user.resetOtp = otp
    user.resetOtpExpireAt = Date.now() * 15 * 60 * 1000
    await user.save()

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Password reset request ",
        text: `Use this otp to reset your password ${otp} `
    }
    // await transporter.sendMail(mailOptions)

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {}, 
        "Password reset otp sent to Email")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const currentRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!currentRefreshToken) {
        res.status(401).json({success: false, message: "Unauthorised access"})
    }

    try {
        const verifiedToken = jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(verifiedToken?._id)
    
        if (!user) {
            res.status(401).json({success: false, message: "Invalid refresh token"})
        }
    
        if (currentRefreshToken !==user?.refreshToken) {
            res.status(401).json({success: false, message: "Refresh token expired or used"})
        }
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newRefreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed"
            )   
        )
    } catch (error) {
        res.status(500).json({success: false, message: error?.message})
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const {email, newPassword, otp} = req.body 

    if (!email || !newPassword || !otp) {
        res.status(404).json({success: false, message: "all fields are required"})
    }

    const user = await User.findOne({email})

    if (!user) {
        res.status(400).json({success: false, message: "user not found"})
    }

    if (user.resetOtp === "" || user.resetOtp !== otp){
        res.status(401).json({success: false, message: "invalid otp"})
    }

    if (user.resetOtpExpireAt < Date.now()) {
        res.status(400).json({success: false, message: "otp expired"})
    }

    user.password = newPassword
    user.resetOtp = ''
    user.resetOtpExpireAt = 0
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password has been reset"
        )
    )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user details fetched successfully"
        )
    )
})

const isAuthenticated = asyncHandler(async (req, res) => {
    res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "user is authenticated"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    sendVerifyOtp,
    sendResetOtp,
    verifyEmail,
    isAuthenticated
}