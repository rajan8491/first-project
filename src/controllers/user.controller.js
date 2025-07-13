import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'
import { upload } from "../middlewares/multer.middleware.js";

const generateAccessAndRefreshToken = async (user) => {
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken};
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exist - username, email
    // check for images - avatar, coverImage
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already ")
    }

    //multer middleware adds files options to req object

    if(!req.files){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0].path

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //get username / email(we use email for verification) and password
    //verify email and password
    //send access and refresh token and also update the refresh token in our db
    //send cookie 

    const {email, password} = req.body;
    if(email === "" || password === ""){
        throw new ApiError(400, "Incorrect credentials");
    }

    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(400, "Incorrect credentials")
    }
    const isPasswordValid = user.isPasswordCorrect(password, user.password)
    if(!isPasswordValid){
        throw new ApiError(400, "Incorrect credentials")
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(user);
    const loggedInUser = User.findById(user._id).select("-password -refreshToken")
    
    //send cookie
    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "Logged In Successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const regenerateToken = asyncHandler(async (req, res) => {
    const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!userRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    
    const decodedToken = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "incorrect userRefreshToken")
    }

    if(userRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token expired")
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(user)

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie('refreshToken', refreshToken)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken},
            "Access Token Refreshed"
        )
    )
    
})

const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = User.findById(req.user?._id)
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isOldPasswordCorrect){
        new ApiError(400, "Incorrect Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password updated successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "current user fetched successfully"
        )
    )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName && !email){
        throw new ApiError(400, "Atleast one field is required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName?fullName:req.user.fullName,
                email: email?email:req.user.email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
    )
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User Avatar updated successfully"
        )
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const imageLocalPath = req.file?.path

    if(!imageLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(imageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "cover image updated successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    regenerateToken,
    changePassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage
}