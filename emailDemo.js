import nodemailer from "nodemailer";

import dotenv from 'dotenv'             
dotenv.config({
    path: './.env'
})

try 
    {
        const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD 
        }
        });

        await transporter.sendMail({
            from: `"No Reply" <${process.env.GMAIL_USER_EMAIL}>`,
            to: "shagun231001001342@technoindiaeducation.com",
            subject: "Email Sent from Node.js using Nodemailer",
            text: `Hii, the date is ${new Date().toLocaleDateString()} and the time is ${new Date().toLocaleTimeString()}`
        });
    } 
    catch (error) {
        throw new apiError(500, `Something went wrong while sending the message and the error is ${error.message}`);
    }