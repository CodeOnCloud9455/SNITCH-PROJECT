import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import userModel from "../models/user.model.js";

export const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }   

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

export const authenticateSeller = async (req, res, next) => {
    console.log("Cookies:", req.cookies);

    const token = req.cookies.token;

    if (!token) {
        console.log("❌ Token not found");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        console.log("Decoded token:", decoded);

        const user = await userModel.findById(decoded.id);

        console.log("User:", user);

        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (user.role !== "seller") {
            console.log("❌ User is not seller:", user.role);
            return res.status(403).json({ message: "Forbidden" });
        }

        req.user = user;
        next();

    } catch (err) {
        console.log("❌ JWT ERROR:", err);
        return res.status(401).json({ message: "Unauthorized" });
    }
};