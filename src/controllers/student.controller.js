import { Student } from "../models/student.model.js";
import { University } from "../models/university.model.js";
import { asynHandler } from "../utils/asynHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import axios from "axios";


export const verifyCertificate = asynHandler(async (req, res, next) => {
    const info = req.body;

    const response = await axios.post("http://localhost:5000/verifyCertificate");    // Replace this with the python url

    // response structure will be like { "status": "OK", "data": {unique_id: "<unique_id retrived from certificate>", "student_id": "", "name": "", "passout_year": "", "university_name": "", "field": "", "education_level": "" } }
   
    if (response.status !== "OK") {
        return new apiError(400, "Something went wrong while parsing the certificate");
    }

    const university = await University.findOne({ name: { $regex: `^${info.name}$`, $options: "i" }, address: { $regex: `^${info.address}$`, $options: "i" } });
    if(!university){
        return next(new apiError(400, "Your university is not registered with us. Please contact the admin."));
    }

    const secret = university.returnUniversity_Secret_Key();
    const decoded = jwt.verify(response.data.unique_id, secret);

    if (decoded.student_id !== info.student_id || decoded.name.toLowerCase() !== info.name.toLowerCase() || decoded.passoutYear !== info.passoutYear || decoded.university_name.toLowerCase() !== info.university_name.toLowerCase() || decoded.field.toLowerCase() !== info.field.toLowerCase() || decoded.educationLevel.toLowerCase() !== info.educationLevel.toLowerCase()) {
        res.status(400).json(new apiError(400, "Certificate details do not match with the credenitials provided in req.body"));
    }

    if (decoded.student_id !== response.data.student_id || decoded.name.toLowerCase() !== response.data.name.toLowerCase() || decoded.passoutYear !== response.data.passout_year || decoded.university_name.toLowerCase() !== response.data.university_name.toLowerCase() || decoded.field.toLowerCase() !== response.data.field.toLowerCase() || decoded.educationLevel.toLowerCase() !== response.data.education_level.toLowerCase()) {
        res.status(400).json(new apiError(400, "Certificate details do not match with the credenitials provided in the certificate"));
    }


    const certificate = await uploadOnCloudinary(req.file.path);
    if(!certificate)
    {
        throw new apiError(400, "certificate has not been uploaded properly to cloudinary")
    }

    const student = await Student.create({
        name: info.name,
        student_id: info.student_id,
        email: info.email,
        university: university._id,
        educationLevel: info.educationLevel,
        field: info.field,
        passoutYear: info.passoutYear,
        uploadedCertificate: certificate.url
    })

    const link= `http://localhost:3000/student/navigate/${student._id}`;   // Replace this with the frontend link

    res.status(200).json(new apiResponse(200, link, "Certificate verified successfully and student added to the database"));
});


export const navigateLink = asynHandler(async (req, res, next) => {
    const { student_id } = req.params;
    if(!student_id)
    {
        throw new apiError(400, "student_id is missing in params");
    }

    const student = await Student.findById(student_id)
    if(!student)
    {
        throw new apiError(404, "Something went wrong. Student not found");
    }

    res.status(200)
       .json(new apiResponse(200, student, "Student found successfully"));
});