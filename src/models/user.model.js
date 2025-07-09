import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true, 
        trim: true,
        index: true
    },
    avatar: {
        type: String, //cloudinary url
        required: true,
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
           type: Schema.Types.ObjectId,
           ref: "Video" 
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},{timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    jwt.sign(
        {
            _id: this._id,
    
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)

/*
brypt: it is used to secure password hashing(unlike encryption(reversible)).
hashing is one way. cant get password from hashed one

working: password+salt is hashed multiple times (based on cost factor >= 10)

*/


/*
JWT: it is a bearer token. Means whoever bear this token is authorised entity(jo bhi jwt bhejega use hum data bhej denge)

#secure way to transmit information between client and server
#structure: header.payload.signature
#validated using secret_key(so protect it(env file))

*/