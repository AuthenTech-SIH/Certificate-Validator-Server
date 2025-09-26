const asyncHandler= (func) => {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next)).catch((err) => next(err))
        // This line is not a code of .then-.catch part. 'Promise.resolve(...)' simply says execute this function 'func' and if there is an error while executing this func,
        // then throw that errror and 'catch' will catch that error in 'err' and then the command is transferred to the catch-block and it knows what to do next
    }
}


export {asyncHandler}