import multer from "multer";

/*
set storage engine
this is where you tell multer where and how to store uploaded files

1.destination: a)a string(static folder path)
               b)a function(dynamic logic per request/file)
*/
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, "../public/temp")
        /*
        must be called to tell multer that 
        (1)there is no error (or report one) 
        (2)provide the destination string
        */
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + '-' + file.originalname)
    }
})

//init upload middleware
export const upload = multer({storage})


/*
multer is a middleware for handling multipart/form-data primarily used for uploading files
multipart/form-data encoding used to seperate file and plain text
multer also adds file option to req object
*/