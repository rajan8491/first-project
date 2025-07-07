import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

/*
some middleware configuration is required

1. CORS(cross origin resource sharing): allows our app(backend) to connect with our frontend

2.cookieParser: to perform crud operations on browser cookie

most middleware config is done using app.use()
*/

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(cookieParser())

//set limit to coming json file
app.use(express.json({limit: "16kb"}))

//to encode data from url
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//to store some files,images on our server
app.use(express.static("public"))



export { app }