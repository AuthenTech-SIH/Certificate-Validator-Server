import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";        // For strong the university secret key in encrypted form

const universitySchema= new mongoose.Schema({
    universityName: {
        type: String
    },
    universityAffiliationAndProof: [
        {
            affiliationBody: {
                type: String
            },
            affiliationCode: {
                type: String
            },
            proofSupportingAffiliation: {       // Assuming there is only one proof to support this claim
                type: String        // cloudinary url
            }
        }
    ],
    institute_id: {
        type: String,
        unique: true,
    },
    year_of_establishment: {
        type: Number
    },
    website: {
        type: String
    },
    type: {
        type: String,
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
    numberOfStudents: {
        type: Number
    },
    numberOfFaculties: {
        type: Number
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    address: {
        type: String,
        lowercase: true
    },
    pincode: {
        type: Number
    },
    officePhoneNumber: {
        type: Number
    },
    universityEmail: {
        type: String,
        lowercase: true
    },
    listOfCoursesOffered: {
        type: [String]       // Array of strings
    },
    password: {
        type: String
    },
    SPOC_name: {
        type: String
    },
    SPOC_designation: {
        type: String
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
        enum: ["Pending", "Approved", "Rejected", "Called", "Incomplete"],
        default: "Incomplete"
    },
    refreshToken: {
        type: String,
        default: null
    }
}, { timestamps: true });


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


universitySchema.methods.generateUniversitySecretKey= function(universityId) {
    const randomPart = Math.random().toString(36).substring(2, 10); 
    const timePart = Date.now().toString(36); 
    const idPart = universityId.toString(24).slice(-4);

    return `${randomPart}${timePart}${idPart}`;
}

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
            universityName: this.universityName,
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
            universityName: this.universityName
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



// Required fields in the model:
// SPOC_email, SPOC_contact, institute_id, password, status, createdAt, updatedAt, refreshToken, type,
// year_of_establishment, website, address, city, state, pincode, officePhoneNumber, universityEmail, 
// SPOC_name, SPOC_designation, listOfCoursesOffered, totalNumberOfStudents, totalNumberOfFaculties,
// { affilation details: need some changes in the frontend too }, university_secret_key, iv, universityName