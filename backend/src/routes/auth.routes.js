import express from "express";

import { register } from "../controllers/auth.controller.js";
import { validateRegister } from "../validators/auth.validator.js";
import { login } from "../controllers/auth.controller.js";
import { validateLogin } from "../validators/auth.validator.js";
import protect from "../middlewares/auth.middleware.js";
import { getCurrentUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getCurrentUser);

export default router;