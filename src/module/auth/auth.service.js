import { getCollection } from "../../common/config/db.js";
import ApiError from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import { buildUserDoc } from "./auth.model.js";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import {
  resetPasswordEmail,
  verificationEmail,
} from "../../common/config/mail.js";

const createHashedToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createHashedPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (userPasswordPlain, userPasswordHashed) => {
  return await bcrypt.compare(userPasswordPlain, userPasswordHashed);
};
//create document and add user into DB its registering the user code
export const registerUser = async (payload) => {
  const User = getCollection("users");

  const normalizedEmail = payload.email.trim().toLowerCase();
  const isemailExist = await User.findOne({ email: normalizedEmail });

  if (isemailExist) {
    throw ApiError.conflict("email is already exists !!");
  }

  const { rawToken, hashedToken } = generateResetToken();

  const hashedPassword = await createHashedPassword(payload.password);

  const userDoc = buildUserDoc({
    name: payload.name,
    email: normalizedEmail,
    password: hashedPassword,
    role: payload.role,
    verificationToken: hashedToken,
  });

  const result = await User.insertOne(userDoc);

  try {
    await verificationEmail(userDoc.email, rawToken);
  } catch (err) {
    await User.deleteOne({ _id: result.insertedId });
    throw ApiError.badRequest("failed to send verification email");
  }

  return {
    _id: result.insertedId, //when user inserted it will return insert id
    name: userDoc.name,
    email: userDoc.email,
  };
};

export const login = async (payload) => {
  //take email and find user in DB
  // then check if password is correct
  // check if verified or not
  const UserCollection = getCollection("users");

  const normalizedEmail = payload.email.trim().toLowerCase();
  const user = await UserCollection.findOne(
    { email: normalizedEmail },
    {
      projection: {
        verificationToken: 0,
        refreshToken: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      },
    },
  );

  if (!user) {
    throw ApiError.unauthorized("Invalid Email !");
  }

  const isPasswordMatch = await comparePassword(
    payload.password,
    user.password,
  );
  if (!isPasswordMatch) {
    throw ApiError.unauthorized("Invalid password !");
  }

  if (!user.isVerified) {
    throw ApiError.forbidden("Please Verify Your Email First Before Login !!");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  const hashedRefreshToken = createHashedToken(refreshToken); //storing secure version of refresh token for safety

  await UserCollection.updateOne(
    { _id: user._id },
    { $set: { refreshToken: hashedRefreshToken } },
  );

  const { password, ...userInfo } = user; //we cant send password to user
  return { user: userInfo, accessToken, refreshToken };
};

export const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized("refresh token missing"); //if token missing or if token is invalid verfiy refreshtoken will be chekcing expiry and throw error and that error is catched and showing that in home.js it should display loggedoutUI if error come so this is the flow now.

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized("invalid refresh token");
  }

  const UserCollection = getCollection("users");
  // const decode = verifyRefreshToken(token);
  const user = await UserCollection.findOne(
    { _id: new ObjectId(decoded.id) },
    {
      projection: {
        verificationToken: 0,
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      },
    },
  );

  if (!user) {
    throw ApiError.unauthorized("user not found !!");
  }

  if (user.refreshToken !== createHashedToken(token)) {
    throw ApiError.unauthorized("invalid refresh token !!");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  return accessToken;
};

export const logout = async (userId) => {
  const UserCollection = getCollection("users");

  const user = await UserCollection.findOne(
    { _id: userId },
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
    throw ApiError.notFound("user not found !");
  }

  await UserCollection.updateOne(
    { _id: userId },
    { $set: { refreshToken: null } },
  );
};

export const forgotPassword = async (userEmail) => {
  const UserCollection = getCollection("users");

  const user = await UserCollection.findOne(
    { email: userEmail },
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
    throw ApiError.notFound("Email does not exist !!");
  }

  const { rawToken, hashedToken } = generateResetToken();

  await UserCollection.updateOne(
    { email: userEmail },
    {
      $set: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 15),
      },
    },
  );

  try {
    await resetPasswordEmail(user.email, rawToken);
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
  }
};

export const resetPassword = async (token, password) => {
  if (!token) {
    throw ApiError.unauthorized("reset password token missing !");
  }

  const UserCollection = getCollection("users");
  const hashedToken = createHashedToken(token);
  const user = await UserCollection.findOne(
    { resetPasswordToken: hashedToken },
    {
      projection: {
        verificationToken: 0,
        password: 0,
        resetPasswordToken: 0,
        refreshToken: 0,
      },
    },
  );

  if (!user) {
    throw ApiError.notFound("user does not exist !");
  }

  if (user.resetPasswordExpires < Date.now()) {
    throw ApiError.badRequest("token expired !");
  }

  const newPassword = await createHashedPassword(password);
  await UserCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    },
  );
};

export const verifyEmail = async (token) => {
  if (!token) {
    throw ApiError.unauthorized("verification token missing !");
  }

  const UserCollection = getCollection("users");
  const hashedToken = createHashedToken(token);
  const user = await UserCollection.findOne(
    { verificationToken: hashedToken },
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
    throw ApiError.notFound("user does not exist !");
  }

  const verifiedUser = await UserCollection.findOneAndUpdate(
    { _id: user._id },
    { $set: { isVerified: true, verificationToken: null } },
    {
      projection: {
        verificationToken: 0,
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
        refreshToken: 0,
      },

      returnDocument: "after",
    },
  );

  return verifiedUser;
};

export const getMe = async (userId) => {
  const UserCollection = getCollection("users");

  const user = await UserCollection.findOne(
    { _id: userId },
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
    throw ApiError.notFound("user not found !");
  }

  return user;
};
