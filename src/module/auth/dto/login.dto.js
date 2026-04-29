import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class loginDto extends BaseDto {
    static schema = Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string()
        .min(8).message("password is required and should be 8 character long")
        .required()
    });
}

export default loginDto;