class ApiError extends Error{
    constructor(statusCode, errMsg){
        super(errMsg);
        this.statusCode = statusCode;
        this.isOperational = true; 
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(err = "Bad Request"){
        return new ApiError(400, err);
    }

    static unauthorized(err = "Unauthorized"){
        return new ApiError(401, err);
    }

    static conflict(err = "Conflict"){
        return new ApiError(409, err);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static notFound(message = "Not Found"){
        return new ApiError(404, message)
    }
}

export default ApiError;