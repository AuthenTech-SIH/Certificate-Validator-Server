import mongoose from "mongoose";

// we will add only those students in the databse whose certificates had been verified
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    student_id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "University",
        required: true
    },
    educationLevel: {
        type: String,
        required: true,
        enum: ["Secondary", "Higher Secondary", "Graduate", "Postgraduate", "Doctorate", "Diploma"]
    },
    field: {
        type: String,
        required: true
    },
    passoutYear: {
        type: Number,
        required: true
    },
    uploadedCertificate: {
        type: String,        // cloudinary url
        required: true
    }
})

export const Student = mongoose.model("Student", studentSchema);