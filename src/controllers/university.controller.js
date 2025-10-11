import { asyncHandler } from "../utils/asyncHandler.js";
import { University } from "../models/university.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


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
        const user= await University.findById(userId)
        
        const accessToken= user.generateAccessToken()

        return {accessToken}
    } 
    catch (error) {
        throw new ApiError(500, `Something went wrong while generating the new access token and the error is ${error}`)
    }
}


export const SPOCRegister= asyncHandler(async (req, res) => {
    const { email, contact } = req.body;

    // Check if the email or contact already exists in our University collection
    const existingUniversity = await University.findOne({ $or: [ { SPOC_email: email }, { SPOC_contact: parseInt(contact, 10) } ] });
    if (existingUniversity) {
        throw new apiError(400, "Email or contact already registered. Please log in.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);  // Generate a 6-digit OTP
    
    let token= null;
    try
    {
        token = jwt.sign({ email, contact, otp }, process.env.JWT_SECRET, { expiresIn: "10m" });
    }
    catch(error)
    {
        throw new apiError(500, `Something went wrong while generating the token and the error is ${error.message}`);
    }

    // Send OTP to user's email using Sendinblue API
    try 
    {
        const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD 
        }
        });

        await transporter.sendMail({
            from: `"No Reply" <${process.env.GMAIL_USER_EMAIL}>`,
            to: email,
            subject: "AuthenTech OTP Code",
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`
        });
    } 
    catch (error) {
        throw new apiError(500, `Something went wrong while sending the OTP and the error is ${error.message}`);
    }


    // Return the token to the client
    return res.status(200)                                      // check 'sameSite: "lax" ' ki yh hoga ki "none"
              .cookie("SPOCRegisterToken", token, {httpOnly: true, secure: false, sameSite: "lax"})   // development k time isko false krr dena, production k time isko true krr dena. This is because development k time pe hamara url http hota h and not https, so agr isme secure: true krr denge toh yh hamare cookies ko allow ni karega
              .json(new apiResponse(200, { otp }, "OTP sent successfully. Check your email."));
});

export const SPOCVerify= asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const token = req.cookies.SPOCRegisterToken  ||  req.headers.authorization?.replace(/^Bearer\s/, "");

    if (!token) {
        throw new apiError(400, "No token provided. Please register again.");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new apiError(400, "OTP expired. Please register again.");
    }

    if (decoded.otp !== parseInt(otp, 10)) {
        throw new apiError(400, "Invalid OTP. Please try again.");
    }

    // If OTP is valid, create a new university document
    const newUniversity = await University.create({
        SPOC_email: decoded.email,
        SPOC_contact: decoded.contact
    });

    const universityID = `INST-${newUniversity._id.toString().slice(-6).toUpperCase()}`

    newUniversity.institute_id = universityID;
    await newUniversity.save({ validateBeforeSave: false });

    res.status(200)
       .clearCookie("SPOCRegisterToken")
       .cookie("universityID", universityID, {httpOnly: true, secure: false, sameSite: "none"})   // development k time isko false krr dena, production k time isko true krr dena. This is because development k time pe hamara url http hota h and not https, so agr isme secure: true krr denge toh yh hamare cookies ko allow ni karega
       .json(new apiResponse(200, { universityID }, "OTP verified successfully."));
})

export const createPassword= asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;
    const universityID = req.cookies.universityID  ||  req.headers['x-university-id'];      // Check yha headers waala part kaise aayega

    if(!universityID) {
        throw new apiError(400, "No university ID provided. Please verify your OTP again.");
    }

    if (password !== confirmPassword) {
        throw new apiError(400, "Password and Confirm Password do not match.");
    }

    const university = await University.findOne({ institute_id: universityID });
    if (!university) {
        throw new apiError(404, "University not found. Please register again.");
    }

    university.password = password;
    await university.save();

    res.status(200)
       .clearCookie("universityID")
       .json(new apiResponse(200, {}, "Password set successfully."));
})

export const checkStatus = asyncHandler(async (req, res) => {
    const { universityID, password } = req.body;

    const university = await University.findOne({ institute_id: universityID });
    if (!university) {
        throw new apiError(404, "University not found. Please register your university to proceed.");
    }

    if(!university.isPasswordCorrect(password)) {
        throw new apiError(401, "Incorrect password. Please try again.");
    }

    if(university.status === "Incomplete") {
        throw new apiError(403, "Your registration is incomplete. Please complete your registration first.");
    }

    
    res.status(200)
       .json(new apiResponse(200, { status: university.status, loginID: university.institute_id, submissionDate:  university.createdAt }, "University status fetched successfully."));
})

export const login = asyncHandler(async (req, res) => {
    const { universityID, password } = req.body;

    if(!universityID.startsWith("INST-")  ||  universityID.length !== 11) {
        throw new apiError(400, "Invalid University ID format. Please correct it and try again.");
    }

    const university = await University.findOne({ institute_id: universityID });
    if (!university) {
        throw new apiError(404, "University not found. Please register your university to proceed.");
    }

    if(!university.isPasswordCorrect(password)) {
        throw new apiError(401, "Incorrect password. Please try again.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(university._id);

    university.refreshToken = refreshToken;
    await university.save({ validateBeforeSave: false });

    res.status(200)
       .cookie("accessToken", accessToken, { httpOnly: true, secure: false, sameSite: "none" })   // development k time isko false krr dena, production k time isko true krr dena. This is because development k time pe hamara url http hota h and not https, so agr isme secure: true krr denge toh yh hamare cookies ko allow ni karega
       .cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "none" }) 
       .json(new apiResponse(200, { university, accessToken }, "Login successful."));
})

export const logout = asyncHandler(async (req, res) => {
    const university = req.university;

    university.refreshToken = null;
    await university.save({ validateBeforeSave: false });

    res.status(200)
       .clearCookie("accessToken")
       .clearCookie("refreshToken")
       .json(new apiResponse(200, {}, "Logout successful."));
})

export const completeUniversityProfile= asyncHandler(async (req, res) => {
    const university= req.university;
    const {
        universityName,
        type,
        year_of_establishment,
        website,
        address,
        city,
        state,
        pincode,
        officePhoneNumber,
        universityEmail,
        SPOC_name,
        SPOC_designation,
        listOfCoursesOffered,
        numberOfStudents,
        numberOfFaculties           
    } = req.body;

    const affiliationBodyCount = Object.keys(req.body).filter(key => key.startsWith("affiliationBody")).length;
    const affiliationCodeCount = Object.keys(req.body).filter(key => key.startsWith("affiliationCode")).length;
    const affiliationProofCount = req.files.filter(f => f.fieldname.startsWith("affiliationProof")).length;
    console.log("\n\n", affiliationBodyCount, affiliationProofCount, affiliationCodeCount, "\n\n");
    if(affiliationBodyCount !== affiliationProofCount  ||  affiliationBodyCount !== affiliationCodeCount) {
        throw new apiError(400, "You must provide all of affiliation body names, their corresponding proofs and their unique codes for each entry.");
    }

    for(let i= 1; i<= affiliationBodyCount; i++)       
    {
        const bodyName= req.body[`affiliationBody${i}`];
        const bodyCode= req.body[`affiliationCode${i}`];

        const file = req.files.find(f => f.fieldname === `affiliationProof${i}`);
        const proof = file ? file.path : null;

        if(!bodyName  ||  !proof  ||  !bodyCode) {
            throw new apiError(400, `All of affiliation body name, its proof and unique code are required for entry ${i}.`);
        }

        const uploadedProof = await uploadOnCloudinary(proof);
        if(!uploadedProof) {
            throw new apiError(500, `Something went wrong while uploading the proof for entry ${i}. Please try again.`);
        }

        university.universityAffiliationAndProof.push({
            affiliationBody: bodyName,
            proofSupportingAffiliation: uploadedProof.url,
            affiliationCode: bodyCode
        });
    }

    university.universityName= universityName;
    university.type= type;
    university.year_of_establishment= year_of_establishment;
    university.website= website;
    university.address= address;
    university.city= city;
    university.state= state;
    university.pincode= pincode;
    university.officePhoneNumber= officePhoneNumber;
    university.universityEmail= universityEmail;
    university.SPOC_name= SPOC_name;
    university.SPOC_designation= SPOC_designation;
    university.listOfCoursesOffered= listOfCoursesOffered.split(",").map(course => course.trim());   
    university.totalNumberOfStudents= numberOfStudents;
    university.totalNumberOfFaculties= numberOfFaculties;
    university.status= "Pending";

    university.university_secret_key= university.generateUniversitySecretKey(university._id);

    await university.save();

    const updatedUniversity= await University.findById(university._id).select("-password -refreshToken -university_secret_key -iv");

    res.status(200)
       .json(new apiResponse(200, { university: updatedUniversity }, "University profile completed successfully."));
})