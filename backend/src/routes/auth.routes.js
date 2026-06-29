import express from "express";

import { register } from "../controllers/auth.controller.js";
import { validateRegister } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validateRegister, register);

export default router;