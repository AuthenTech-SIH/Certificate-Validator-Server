import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(bodyParser.json());
app.use(express.static("public"))       // 'public' is the folder name we have created
app.use(cookieParser())


// import routes here
import refreshTokenRoutes from "./routes/refresh-token.routes.js";

import universityRoutes from "./routes/university.routes.js";


// declare routes here
app.use("/api/university", refreshTokenRoutes);

app.use("/api/university", universityRoutes);


// Error-handling middleware (it will now throw the error in json format). 
// This middleware should be at the end of all routes, ALWAYS.
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500)
       .json({  success: err.success || false,
                message: err.message || "Internal Server Error",
                errors: err.errors || [],
                data: err.data || null
            });
});


export default app;