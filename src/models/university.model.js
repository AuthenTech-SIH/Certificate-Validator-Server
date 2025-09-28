import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";        // For strong the university secret key in encrypted form

const universitySchema= new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    universityAffiliationAndCode: [
        {
            affiliation: {
                type: String,
                required: true
            },
            code: {
                type: String,
                required: true,
                unique: true
            },
            proofSupportingAffiliation: {       // Assuming there is only one proof to support this claim
                type: String        // cloudinary url
            }
        }
    ],
    type: {
        type: String,
        required: true,
        enum: [
            "Government",
            "Private",
            "Deemed",
            "Central",
            "State",
            "Autonomous",
            "Open",
            "Institute of National Importance",
            "State Private",
            "State Public",
            "Deemed to be University"
        ]
    },
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    SPOC_name: {
        type: String,
        required: true
    },
    SPOC_email: {
        type: String,
        required: true
    },
    SPOC_contact: {
        type: Number,
        required: true
    },
    university_secret_key: {
        type: String,
        default: null
    },
    iv: {       // Some used for decrypting the university secret key
        type: String,
        default: null
    },  
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Called"],
        default: "Pending"
    },
    refreshToken: {
        type: String,
        default: null
    }
})

universitySchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password, 10);
    }
    next();
})

universitySchema.pre("save", async function(next) {
    if(this.isModified("university_secret_key") && this.university_secret_key){
        const secret_key= process.env.UNIVERSITY_SECRET_KEY_ENCRYPTION;   

        const iv = crypto.randomBytes(16); 
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret_key), iv); 
        let encrypted = cipher.update(this.university_secret_key, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        this.iv = iv.toString('hex');
        this.university_secret_key = encrypted;
    }
    next();
})


universitySchema.methods.isPasswordCorrect= async function(password) {
    return await bcrypt.compare(password, this.password);
}

universitySchema.methods.returnUniversity_Secret_Key= function() {
    const secret_key= process.env.UNIVERSITY_SECRET_KEY_ENCRYPTION;

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret_key), Buffer.from(this.iv, 'hex'));
    let decrypted = decipher.update(this.university_secret_key, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

universitySchema.methods.generateAccessToken = function () {
    const access_token= jwt.sign(       // Used to generate token
        {       
            _id: this._id,
            name: this.name,
            SPOC_name: this.SPOC_name,
            status: this.status
        },
        process.env.ACCESS_TOKEN_SECRET,            
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            algorithm: 'HS256'
        }
    )      

    return access_token
}       

universitySchema.methods.generateRefreshToken = function () {
    const refresh_token= jwt.sign(
        {
            _id: this._id,
            name: this.name
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            algorithm: 'HS256'
        }
    )

    return refresh_token
}


export const University= mongoose.model("University", universitySchema);