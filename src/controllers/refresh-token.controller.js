import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/ApiResponse.js";
import { University } from "../models/university.model.js";
import { generateOnlyAccessToken } from "../controllers/university.controller.js";
import jwt from "jsonwebtoken";



export const refreshAccessToken= asyncHandler( async (req, res) => {
    const incomingRefreshToken= req.cookies.refreshToken   ||   req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new apiError(401, "Unauthorized Request as no refresh token is present")
    }


    try
    {
        const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)


        const university= await University.findById(decodedToken?._id)         // Here we are using ?. opearator beacause jaruri ni h ki hamare decoded token mei payloads (data) ho hi, it may be that refreshToken define krte waqt hmlog usme koi payloads na daale ho

        if(!university)
        {
            throw new apiError(401, "Invalid Refresh Token")
        }



        if(incomingRefreshToken !== university.refreshToken)
        {
            throw new apiError(401, "Refresh Token is either expired or used. Please login again")
        }




        const {accessToken}= await generateOnlyAccessToken(user._id)       // Yha pe Access Token ka naam should be same as you had given while returning values from the given function. Ni toh bahaut der phasoge

        const options= {
            httpOnly: true,
            secure: false        // Remember, development k time false, production k time true
        }

        return res.status(200)
                .cookie("accessToken", accessToken, options)
                .json(new apiResponse(
                                        200,
                                        {accessToken},
                                        "Access Token refreshed successfully"
                                    ))
    }
    catch(error)
    {
        throw new apiError(401, error?.message  ||  "Something went wrong while refreshing our Access Token")
    }
} )