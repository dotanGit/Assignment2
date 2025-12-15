import express from "express";
import userController from "../controllers/user_controller";

const router = express.Router();

router.post("/register", userController.register);

router.post("/login", userController.login);

router.post("/logout", userController.logOut);

router.post("/refresh-token", userController.refreshToken);

export default router;