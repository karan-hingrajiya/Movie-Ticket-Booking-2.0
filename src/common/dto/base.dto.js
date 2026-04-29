import Joi from "joi";

class BaseDto {
  static schema = Joi.object({});

  static validate(data) {
    const { error, value } = this.schema.validate(data, {
      stripUnknown: true, 
      abortEarly: false, 
    });

    if (error) {
      //error.details//it gives array of errors that came
      const errors = error.details.map((err) => {
        return err.message;
      });

      return { errors, value: null }; 
    } else {
      return { errors: null, value }; 
    }
  }
}

export default BaseDto;
