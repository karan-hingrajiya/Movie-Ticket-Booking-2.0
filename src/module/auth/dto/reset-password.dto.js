import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class resetPassDto extends BaseDto {
    static schema = Joi.object({
        password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9@$!%*?&]{8,}$/).required().messages({"string.min" : "password must be at least 8 character long",
        "string.pattern.base" : "password must contain atleast one uppercase, one lowercase letter and one digit",
        "any.required": "password is required",
        }),
    });
}

export default resetPassDto;