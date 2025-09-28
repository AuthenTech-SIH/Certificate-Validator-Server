import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))       // 'public' is the folder name we have created
app.use(cookieParser())


// import routes here
import refreshTokenRoutes from "./routes/refresh-token.routes.js";

import adminRoutes from "./routes/admin.routes.js";
import universityRoutes from "./routes/university.routes.js";
import studentRoutes from "./routes/student.routes.js";


// declare routes here
app.use("/api/university", refreshTokenRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/student", studentRoutes);


export default app;