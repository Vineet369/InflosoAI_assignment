import { asyncHandler } from "../ utils/asyncHandler.js";
import { ApiError } from "../ utils/ApiError.js";
import { User } from "../ models/user.models.js";
import { uploadOnCloudinary } from "../ utils/cloudinary.js";
import { ApiResponse } from "../ utils/ApiResponse.js";
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
        throw new ApiError(500, "access and refresh token generation failed!")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, userName, email, password} = req.body

    if ([fullName, userName, email, password].some((entry) => {
        entry?.trim===""
    })){
        throw new ApiError(400, "Field cannot be empty")
    }

    const existedUser = await User.findOne({
        $or:[{userName},{email}]
    })

    if (existedUser){
        throw new ApiError(409, "Email or username already registered")
    }

    let coverImageFilePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageFilePath = req.files.coverImage[0].path;
    }

    const coverImage = await uploadOnCloudinary(coverImageFilePath)

    const user = await User.create({
        fullName,
        email,
        userName: userName.toLowerCase(),
        coverImage: coverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registration successful")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, userName, password} = req.body

    if (!(userName || email)){
        throw new ApiError(400, "Please provide valid username or email")
    }

    const user = await User.findOne({
        $or: [{email},{userName}]
    })

    if (!user) {
        throw new ApiError(404, "No registered user data found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }
    // console.log("user", user)
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.PROJECT_ENV === "production",
        sameSite: process.env.PROJECT_ENV === "production" ? "none" : "strict",
        maxAge: 7*24*60*60*1000
    }

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to ",
        text: `You have successfully logged in to _ via email ${email}`
    }

    await transporter.sendMail(mailOptions)

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
        maxAge: 7*24*60*60*1000
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
        const {userId} = req.user._id
    
        const user = await User.findById(userId)
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

        return res
        .status(200)
        .json( new ApiResponse(
            200, 
            {},
            "Verification code sent via Email. Check your registered mail")
        )

} catch (error) {
    throw new ApiError(500, error?.message || "Account verification Failed!")
}
})

const verifyEmail = asyncHandler(async (req, res) => {
    const {otp} = req.body
    const {userId} = req.user._id

    if (!userId || !otp ) {
        throw new ApiError(404, "userId and otp is required")
    }
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (user.verifyOtp === "" || user.verifyOtp !== otp){
            throw new ApiError(400, "Invalid Otp")
        }

        if (user.verifyOtpExpireAt < Date.now()){
            throw new ApiError(400, "Otp expired!")
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
        
    }

})

const sendResetOtp = asyncHandler(async (req, res) => {
    const {email} = req.body

    if (!email) {
        throw new ApiError(401, "Email is required")
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "No user found with this email")
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
        throw new ApiError(401, "Unauthorised access")
    }

    try {
        const verifiedToken = jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(verifiedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (currentRefreshToken !==user?.refreshToken) {
            throw new ApiError(401, "Refresh token expired or used")
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
        throw new ApiError(
            401,
            error?.message || "invalid token"
        )
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const {email, newPassword, otp} = req.body 

    if (!email || !newPassword || !otp) {
        throw new ApiError(404, "all fields are required")
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(400, "user not found")
    }

    if (user.resetOtp === "" || user.resetOtpExpireAt !== otp){
        throw new ApiError(401, "invalid otp")
    }

    if (resetOtpExpireAt < Date.now()) {
        throw new ApiError(400, "otp expired")
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


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    sendVerifyOtp,
    sendResetOtp,
    verifyEmail
}