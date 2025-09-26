import mongoose from "mongoose";


const connectDB = async () => {
    try 
    {
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_CONNECTION_URL}/${process.env.DB_NAME}`)
        console.log("MongoDB Connected!! DB Host: ", connectionInstance.connection.host)
    } 
    catch (error)
    {
        console.log("MongoDb Connection Failed: ", error)
        process.exit(1)     
    }
};


export default connectDB;