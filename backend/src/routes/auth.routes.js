import express from "express";

import { register } from "../controllers/auth.controller.js";
import { validateRegister } from "../validators/auth.validator.js";
import { login } from "../controllers/auth.controller.js";
import { validateLogin } from "../validators/auth.validator.js";
import protect from "../middlewares/authenticate.middleware.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import authorize from "../middlewares/authorize.middleware.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getCurrentUser);

router.get(
    "/student-only",
    protect,
    authorize(ROLES.STUDENT),
    (req, res) => {
      res.json({
        success: true,
        message: "Welcome Student!",
      });
    }
  );
  
  router.get(
    "/company-only",
    protect,
    authorize(ROLES.COMPANY),
    (req, res) => {
      res.json({
        success: true,
        message: "Welcome Company!",
      });
    }
  );
  
  router.get(
    "/admin-only",
    protect,
    authorize(ROLES.ADMIN),
    (req, res) => {
      res.json({
        success: true,
        message: "Welcome Admin!",
      });
    }
  );

export default router;