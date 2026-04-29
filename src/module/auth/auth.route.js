import registerDto from "./dto/register.dto.js";
import validate from "../../common/middleware/validate.middleware.js"; 
import * as authController from "./auth.controller.js";
import { Router } from "express";
import loginDto from "./dto/login.dto.js";
import { authenticate } from "./auth.middleware.js";
import forgotPassDto from "./dto/forgot-password.dto.js";
import resetPassDto from "./dto/reset-password.dto.js";

const router = Router();


router.post("/register", validate(registerDto), authController.register);
router.post("/login", validate(loginDto), authController.login);
router.post("/refresh-token", authController.refresh);
router.post("/logout", authenticate, authController.logout); //req.user.id pass kari desu 
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/forgot-password", validate(forgotPassDto), authController.forgotPassword);
router.put("/reset-password/:token", validate(resetPassDto), authController.resetPassword);

router.get("/getme", authenticate, authController.getme);

export default router;