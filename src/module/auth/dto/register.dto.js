import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class registerDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9@$!%*?&]{8,}$/)
      .required()
      .messages({
        "string.min": "password must be at least 8 character long",
        "string.pattern.base":
          "password must contain atleast one uppercase, one lowercase letter and one digit",
        "any.required": "password is required",
      }),
    // role: Joi.string().valid("user").default("user"),
  });
}

export default registerDto;
