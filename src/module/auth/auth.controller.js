import * as authService from "./auth.service.js";
import ApiResponse from "../../common/utils/api-response.js";

export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);
  ApiResponse.created(res, "Registration Successful", {user});
};

export const login = async (req,res) => {
  const {user, accessToken, refreshToken} = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, {
    httpOnly : true,
    secure : process.env.NODE_ENV === "production",
    //secure: true means browser only stores the cookie over HTTPS. If you are testing on http://localhost, refresh token cookie may not be saved.
    sameSite : "strict",
    maxAge : 1000 * 60 * 60 * 24 * 7, 
  });

  ApiResponse.ok(res, "login successful", {user, accessToken});
}
// ! write expire refresh token code what happens when refresh token expires
export const refresh = async (req,res) => {
  const token = req.cookies?.refreshToken;
  const accessToken = await authService.refresh(token);
  ApiResponse.ok(res, "Access Token Granted", accessToken);
}

export const verifyEmail = async (req,res) => {
  await authService.verifyEmail(req.params.token);
  ApiResponse.ok(res, "Email verification Successful");
}

export const logout = async (req,res) => {
  await authService.logout(req.user.id);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  }); //we need to clear the cookie where refresh token stored so user cant have access for website without login again.
  ApiResponse.ok(res, "logged out successfully");
}

export const forgotPassword = async (req,res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, "forgot password email sent !");
}

export const resetPassword = async (req,res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.ok(res, "Password reset successful");
}

export const getme = async (req,res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.ok(res, "User Profile", user);
}
