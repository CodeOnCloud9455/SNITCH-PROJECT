import { Router } from "express";
import { validateRegisterUser, validateLoginUser } from "../validator/auth.validator.js";

import { 
    getMe, 
    googleCallback, 
    login, 
    register,
    updateProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    changePassword,
    updatePreferences
} from "../controllers/auth.controller.js";
import passport from "passport";
import { config } from "../config/config.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/register', validateRegisterUser, register);
router.post("/login", validateLoginUser, login);

router.get("/google", passport.authenticate("google", { scope: [ "profile", "email"]}));
router.get("/google/callback",
    passport.authenticate("google", 
        { session: false,
            failureRedirect: config.NODE_ENV == "development" ? "http://localhost:5173/login": "/login"
        }),
    googleCallback,
);

router.get("/me", authenticateUser, getMe);
router.put("/profile", authenticateUser, updateProfile);

// Addresses routes
router.get("/addresses", authenticateUser, getAddresses);
router.post("/addresses", authenticateUser, addAddress);
router.put("/addresses/:addressId", authenticateUser, updateAddress);
router.delete("/addresses/:addressId", authenticateUser, deleteAddress);
router.put("/addresses/:addressId/default", authenticateUser, setDefaultAddress);

// Password & Preferences routes
router.put("/password", authenticateUser, changePassword);
router.put("/preferences", authenticateUser, updatePreferences);

export default router;