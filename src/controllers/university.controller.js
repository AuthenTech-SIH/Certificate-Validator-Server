import { asynHandler } from "../utils/asynHandler.js";
import { University } from "../models/university.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Yha pe I think kuch glt h coz regsiter karate waqtt hmlog affiliation and proof toh maang hi ni rhe h
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

export const generateOnlyAccessToken= async (userId) => {
    try 
    {
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()


        return {accessToken}
    } 
    catch (error) {
        throw new ApiError(500, `Something went wrong while generating the new access token and the error is ${error}`)
    }
}


export const loginUniversity = asynHandler(async (req, res) => {
    const { name, password } = req.body;

    const university = await University.findOne({ name: { $regex: `^${name}$`, $options: "i" }});
    if(!university){
        return next(new apiError(400, "University of this name not found"));
    }


    const isPasswordValid = await university.isPasswordValid(password);
    if(!isPasswordValid){
        return next(new apiError(400, "Invalid password"));
    }

    if(university.status === "Pending")
    {
        res.status(400).json(new apiResponse(400, {}, "Cannot login as your status is Pending"))
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


export const logoutUniversity = asynHandler(async (req, res) => {
    const university = req.university

    const uni = await University.findById(university._id)

    uni.refreshToken= null
    await uni.save({validateBeforeSave: false})

    return res.status(200)
              .clearCookie("accessToken")
              .clearCookie("refreshToken")
              .json(new apiResponse(200, {}, "University logged out successfully"))
})

// Iske andar ek part check krna and that's written there. Check that out
export const checkUniversityStatus = asynHandler(async (req, res) => {
    const { name }= req.body        // yh wala ek baar check krr lena ki info kaha se aara h params, body, or from verifyJWT middleware

    const university = await University.findOne({ name: { $regex: `^${name}$`, $options: "i" }});

    res.status(200)
       .json(new apiResponse(200, {status: university.status}, "University status fetched successfully"))
})


export const updateUniversity = asynHandler(async (req, res) => {
    const university = req.university
    const info = req.body

    if(info.password)
    {
        university.password = info.password
    }

    if(info.SPOC_name)
    {
        university.SPOC_name = info.SPOC_name
        university.SPOC_email = info.SPOC_email
        university.SPOC_contact = info.SPOC_contact
    }

    const upadted = await university.save()

    return res.status(200)
              .json(new apiResponse(200, upadted, "University updated successfully"))
})


export const deleteUniversity = asynHandler(async (req, res) => {
    const university = req.university

    await university.remove()

    return res.status(200)
              .clearCookie("accessToken")
              .clearCookie("refreshToken")
              .json(new apiResponse(200, {}, "University deleted successfully"))
})

// Here we are going with the option of uploading the excel file and instantly get the response rather than taking a day time to get the response
export const uploadListOfStudentsPassing = asynHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new apiError(400, "No file uploaded"));
    }

    // Prepare form data to send to backend
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    try {
        // Send file to backend server (adjust URL as needed)
        const backendResponse = await axios.post(
            "http://localhost:5001/process-excel", // Change to your backend endpoint
            form,
            {
            headers: form.getHeaders(),
            responseType: "arraybuffer" 
            }
        );

        // Set response headers for file download
        res.setHeader("Content-Disposition", "attachment; filename=processed_students.csv");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.status(200).send(Buffer.from(backendResponse.data));
    } 
    catch (error) {
        return next(new apiError(500, "Failed to process Excel file"));
    } 
    finally {
        // Clean up uploaded file
        fs.unlink(req.file.path, () => {});
    }
});


// Since we are instantly getting the reponse after uploading the excel file, so this function is not needed
// export const getUpdatedListOfStudents = asynHandler(async (req, res) => { } )