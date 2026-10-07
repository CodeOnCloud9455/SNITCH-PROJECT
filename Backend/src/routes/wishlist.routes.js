import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
    getWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.get("/", authenticateUser, getWishlist);
router.post("/toggle", authenticateUser, toggleWishlist);
router.post("/add", authenticateUser, toggleWishlist);
router.delete("/remove/:productId", authenticateUser, removeFromWishlist);
router.delete("/clear", authenticateUser, clearWishlist);
router.post("/clear", authenticateUser, clearWishlist);

export default router;
