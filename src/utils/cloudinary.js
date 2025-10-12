import {v2 as cloudinary} from "cloudinary"
import fs from "fs"     
import { apiError } from "../utils/apiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,          
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


// Uploading the file
const uploadOnCloudinary= async (localFilePath) => {
    try
    {
        if(!localFilePath) {        
            console.log(`There is no path as ${localFilePath}. Re-check your path`)
            return null
        }
        
        // Uploading 
        const response= await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})        

        console.log("File has been uploaded successfully and the response url is: ", response.url);
        
        return response
    }
    catch(error)
    {
        throw new apiError(500, "Error uploading file to Cloudinary and the error is: " + error.message)
    }
    finally
    {
        fs.unlinkSync(localFilePath)    // remove the locally saved temporary file
    }
}


export {uploadOnCloudinary}