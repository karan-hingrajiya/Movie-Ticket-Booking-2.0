import { getCollection } from "../../common/config/db.js";
import ApiError from "../../common/utils/api-error.js";
import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";

const authenticate = async function (req, res, next) {
  // Try access token from Authorization header first
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw ApiError.unauthorized("Not Authenticated !");
  }

  const decode = verifyAccessToken(token); //this will send 401 error if access token is expires it check it is expired token then send error and code 401
  const user = await getCollection("users").findOne(
    { _id: new ObjectId(decode.id) },
    {
      projection: {
        verificationToken: 0,
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
        refreshToken: 0,
      },
    },
  );

  if (!user) {
    throw ApiError.notFound("user not found !!");
  }

  req.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  next();
};

const authorization = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.unauthorized(
        "you do not have permission to access this !!",
      );
    }
    next();
  };
};

export { authenticate, authorization };
