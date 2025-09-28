import { Admin } from "../models/admin.model.js";
import { University } from "../models/university.model.js";
import { asynHandler } from "../utils/asynHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";


export const registerAdmin = asynHandler(async (req, res, next) => {
    const { name, admin_id, email, contact, password } = req.body;


    if (!name || !email || !password || !admin_id || !contact) {
        return next(apiError("All fields are required", 400));
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ admin_id, email });
    if (existingAdmin) {
        return next(apiError("Admin already exists", 400));
    }

    // Create new admin
    const newAdmin = await Admin.create({ name, email, password, admin_id, contact });
    return res.status(201)
              .json(new apiResponse(201, newAdmin, "Admin registered successfully"));
});



const generateAccessAndRefreshToken = async (adminId) => {
    try 
    {
        const admin = await Admin.findById(adminId);
        
        const accessToken = admin.generateAccessToken();
        const refreshToken = admin.generateRefreshToken();

        admin.refreshToken = refreshToken;
        await admin.save({ validateBeforeSave: false }); // Save without validating other fields

        return { accessToken, refreshToken };
    } 
    catch (error) 
    {
        throw new apiError(500, `Something went wrong while generating the token and the error is ${error}`)
    }
}

export const generateOnlyAccessToken = async (adminId) => {
    try
    {
        const admin = await Admin.findById(adminId);

        const accessToken = admin.generateAccessToken();

        return { accessToken };
    }
    catch(error)
    {
        throw new apiError(500, `Something went wrong while generating the new access token and the error is ${error}`)
    }
}


export const loginAdmin = asynHandler(async (req, res, next) => {
    const { admin_id, email, password } = req.body;

    if (!admin_id && !email) {
        throw new apiError(400, "Admin ID or Email is required");
    }
    if (!password) {
        throw new apiError(400, "Password is required");
    }

    const admin = await Admin.findOne({ $or: [ { admin_id }, { email } ] });
    if (!admin) {
        throw new apiError(404, "Admin not found");
    }

    if(!await admin.isValidPassword(password)){
        throw new apiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(admin._id);

    const options= {
        httpOnly: true,
        secure: false       // development k time isko false krr dena, production k time isko true krr dena. This is because development k time pe hamara url http hota h and not https, so agr isme secure: true krr denge toh yh hamare cookies ko allow ni karega    
    }

    res.status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", refreshToken, options)
       .json(new apiResponse(200, admin, "Admin logged in successfully"));
})

export const logoutAdmin = asynHandler(async (req, res, next) => {
    const admin = req.admin

    admin.refreshToken = null;
    await admin.save({ validateBeforeSave: false });

    res.status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new apiResponse(200, {}, "Admin logged out successfully"));
})

export const deleteAdmin = asynHandler(async (req, res, next) => {
    const admin = req.admin

    await Admin.findByIdAndDelete(admin._id);

    res.status(200)
       .clearCookie("accessToken")
       .clearCookie("refreshToken")
       .json(new apiResponse(200, {}, "Admin deleted successfully"));
})

export const updateAdmin = asynHandler(async (req, res, next) => {
    const admin = req.admin
    const { name, email, password, contact } = req.body

    // const adminToBeUpdated = await Admin.findById(admin._id)       // Ye line isliye ni likhre coz 'admin' mei already hamara admin ka pura document aa chuka h

    if (name) admin.name = name
    if (email) admin.email = email
    if (password) admin.password = password
    if (contact) admin.contact = contact

    await admin.save()

    const updatedAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    res.status(200)
       .json(new apiResponse(200, updatedAdmin, "Admin updated successfully"))
})

export const getPendingUniversities = asynHandler(async (req, res, next) => {
    const universities= await University.find({status: "Pending"}).select("-password -university_secret_key -iv -refreshToken")

    return res.status(200)
              .json(new apiResponse(200, universities, "Pending universities fetched successfully"))
})

export const viewUniversityProfile = asynHandler(async (req, res, next) => {
    const { universityId }= req.params

    const university= await University.findById(universityId).select("-password -university_secret_key -iv -refreshToken")

    if(!university)
    {
        return next(apiError(404, "University not found"))
    }

    return res.status(200)
         //   .cookie("universityId", universityId, options)         // Check if we need this cookie or not
              .json(new apiResponse(200, university, "University profile fetched successfully"))
})

// One part is left to be handled. Check the notes inside
export const acceptUniversity = asynHandler(async (req, res, next) => {
    const { universityId }= req.params
    if(!universityId)
    {
        throw new apiError(400, "University ID is missing in params")
    }

    
    const university= await University.findById(universityId)
    if(!university)
    {
        throw new apiError(404, "University not found")
    }

    university.status= "Accepted"
    // more operations to be done here like sending email to the university about acceptance, genrate university secret key, iv, etc.
    await university.save({validateBeforeSave: false})

    const updatedUniversity= await University.findById(universityId).select("-password -university_secret_key -iv -refreshToken")

    res.status(200)
       .json(new apiResponse(200, updatedUniversity, "University accepted successfully"))
})

// One part is left to be handled. Check the notes inside
export const rejectUniversity = asynHandler(async (req, res, next) => {
    const { universityId }= req.params
    if(!universityId)
    {
        throw new apiError(400, "University ID is missing in params")
    }

    
    const university= await University.findById(universityId)
    if(!university)
    {
        throw new apiError(404, "University not found")
    }

    university.status= "Rejected"
    // An operation to be done here like sending email to the university about rejection
    await university.save({validateBeforeSave: false})

    const updatedUniversity= await University.findById(universityId).select("-password -university_secret_key -iv -refreshToken")

    res.status(200)
       .json(new apiResponse(200, updatedUniversity, "University rejected successfully"))
})

// One part is left to be handled. Check the notes inside
export const callUniversity = asynHandler(async (req, res, next) => {
    const { universityId }= req.params
    if(!universityId)
    {
        throw new apiError(400, "University ID is missing in params")
    }

    
    const university= await University.findById(universityId)
    if(!university)
    {
        throw new apiError(404, "University not found")
    }

    university.status= "Called"
    // An operation to be done here like sending email to the university about being called for further verification
    await university.save({validateBeforeSave: false})

    const updatedUniversity= await University.findById(universityId).select("-password -university_secret_key -iv -refreshToken")

    res.status(200)
       .json(new apiResponse(200, updatedUniversity, "University called successfully"))
})