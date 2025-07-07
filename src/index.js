//require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config({
    path: './env4'
})

connectDB()










/*
for learning

( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("DB connected")

        app.on("error", (err) => {
            console.error("ERROR: ", error)
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`Listening on PORT: ${process.env.PORT}`)
        })
    } catch(error) {
        console.error("ERROR :", error);
        throw error
    }
})()

*/