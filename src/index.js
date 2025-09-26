import dotenv from 'dotenv'             // from now we are using 'import' instead of 'require' for dotenv
dotenv.config({
    path: './.env'
})


const port= process.env.PORT  ||  8000

import connectDB from './db/index.js'
import app from './app.js'

connectDB()             
.then(() => {           
    app.on("error", (err) => {
        console.log("Error message: ", err)
        throw err
    })

    app.listen(port, () => {
        console.log(`Process is running on port: ${port}`)
    })
})                 
.catch((err) => {       // When the promise fails (basically the catch block)
    console.log("MONGO db connection failed. Error message 2: ", err)
})