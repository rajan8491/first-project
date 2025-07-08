const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((err) => next(err))
    }
}

export {asyncHandler}















// higher order function :- function which accept a function as argument and return another function 


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     }catch {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
