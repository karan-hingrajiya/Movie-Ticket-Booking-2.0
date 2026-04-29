class ApiResponse {
    static ok(res, message, data = null) {
        return res.status(200).json({
            status : true,
            message,
            data
        });
    }

    static created(res, message, data = null) {
        return res.status(201).json({
            status : true,
            message,
            data
        });
    }

    static noContent(res) {
        return res.status(204).send(); //no content if dont want to send anything
    }
}

export default ApiResponse;