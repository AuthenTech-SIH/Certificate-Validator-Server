import { asynHandler } from "../utils/asynHandler.js";
import { University } from "../models/university.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";


export const registerUniversity = asynHandler(async (req, res, next) => {
    const info = req.body;

    if (await University.findOne({ name: { $regex: `^${info.name}$`, $options: "i" }, SPOC_email: info.SPOC_email })) {
        return next(new apiError(400, "University with this email already exists"));
    }

    const university = await University.create({
        name: info.name,
        type: info.type,
        state: info.state,
        district: info.district,
        address: info.address,
        password: info.password,
        SPOC_name: info.SPOC_name,
        SPOC_email: info.SPOC_email,
        SPOC_contact: info.SPOC_contact
    });


    return res.status(201)
              .json(new apiResponse(201, university, "University registered successfully"));
})


const generateAccessAndRefreshTokens= async (uniId) => {
    try 
    {
        const Uni= await University.findById(uniId)
        const accessToken= Uni.generateAccessToken()
        const refreshToken= Uni.generateRefreshToken()

        Uni.refreshToken= refreshToken
        await Uni.save({validateBeforeSave: false})      // yha pe isko 'false' isliye kiye kyuki agr ni krte toh refresh token update krte time yh mere se baki saara required fields bhi maangta jaise password, email and all. Yha isko bol diye ki jaisa bole h waisa kro apna dimaag mtt chalao

        return {accessToken, refreshToken}
    } 
    catch (error) {
        throw new addresspiError(500, `Something went wrong while generating the token and the error is ${error}`)
    }
}

// logic for the case when access token is expired and logic for the case when refresh token is expired need to be handled, it's left
export const loginUniversity = asynHandler(async (req, res, next) => {
    const { name, password } = req.body;

    const university = await University.findOne({ name: { $regex: `^${name}$`, $options: "i" }});
    if(!university){
        return next(new apiError(400, "University of this name not found"));
    }


    const isPasswordValid = await university.isPasswordValid(password);
    if(!isPasswordValid){
        return next(new apiError(400, "Invalid password"));
    }

    const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(university._id)

    const updatedUni = await University.findById(university._id)
                                       .select("-password -university_secret_key -iv -refreshToken");

    const options= {
        httpOnly: true,
        secure: false       // development k time isko false krr dena, production k time isko true krr dena. This is because development k time pe hamara url http hota h and not https, so agr isme secure: true krr denge toh yh hamare cookies ko allow ni karega    
    }

    return res.status(200)
              .cookie("accessToken", accessToken, options)
              .cookie("refreshToken", refreshToken, options)
              .json(new apiResponse(200, updatedUni, "University logged in successfully"));
})

export const checkUniversityStatus = asynHandler(async (req, res, next) => {
    // yh wala ek baar check krr lena ki info kaha se aara h params or body
})