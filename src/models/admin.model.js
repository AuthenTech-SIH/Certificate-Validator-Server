import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    admin_id: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        unique: true,
    },
    refreshToken: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: true
    }       // Aur kuch lagega toh baad mei add krr dena jaise role, branch in which they are working, etc.
});


adminSchema.pre("save", async function (next) {
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password, 6);
    }
    next();
})



adminSchema.methods.isValidPassword = async function(passwordEntered) {
    return await bcrypt.compare(passwordEntered, this.password);
}

adminSchema.methods.generateAccessToken = function () {
    const access_token= jwt.sign(       // Used to generate token
        {       
            _id: this._id,
            name: this.name,
            admin_id: this.admin_id
        },
        process.env.ACCESS_TOKEN_SECRET,            
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            algorithm: 'HS256'
        }
    )      

    return access_token
}       

adminSchema.methods.generateRefreshToken = function () {
    const refresh_token= jwt.sign(
        {
            _id: this._id,
            admin_id: this.admin_id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            algorithm: 'HS256'
        }
    )

    return refresh_token
}

export const Admin = mongoose.model("Admin", adminSchema);