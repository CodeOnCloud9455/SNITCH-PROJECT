import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {config} from "../config/config.js";

async function sendTokenResponse(user, res, message) {
    const token = jwt.sign(
        {
            id: user._id,
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    console.log("TOKEN CREATED:", !!token);

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
    });

    console.log("COOKIE SET");

    return res.status(200).json({
        success: true,
        message,
        user: {
            id: user._id,
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            contact: user.contact,
            role: user.role,
            profilepic: user.profilepic || "",
            bio: user.bio || "",
            addresses: user.addresses || [],
            preferences: user.preferences || {
                emailNotifications: true,
                smsUpdates: true,
                twoFactor: false,
                darkTheme: true
            },
            createdAt: user.createdAt
        },
    });
}

export const register = async (req, res) => {
    const { email, contact, password, fullname, isSeller } = req.body;

    try {
        const existingUser = await userModel.findOne({
            $or: [
                { email },
                { contact }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email or contact already exists",
            });
        }

        const user = await userModel.create({
            email,
            contact,
            password,
            fullname,
            role: isSeller ? "seller" : "buyer",
        });

        await sendTokenResponse(
            user,
            res,
            "User registered successfully"
        );

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    const user = await userModel.findOne({ email });

    console.log("USER FOUND:", !!user);

    if (!user) {
        console.log("❌ Email not found:", email);

        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    const isMatch = await user.comparePassword(password);

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
        console.log("❌ Password does not match");

        return res.status(400).json({
            message: "Invalid email or password"
        });
    }

    console.log("✅ Login successful");

    await sendTokenResponse(
        user,
        res,
        "User logged in successfully"
    );
};

export const googleCallback = async (req, res) => {
    try {
        const { id, displayName, emails, photos } = req.user;

        const email = emails?.[0]?.value;
        const profilepic = photos?.[0]?.value;

        if (!email) {
            return res.status(400).json({
                message: "Google account email not found"
            });
        }

        // Find existing user
        let user = await userModel.findOne({ email });

        // Create user if not exists
        if (!user) {
            user = await userModel.create({
                email,
                googleId: id,
                fullname: displayName,
                profilepic,
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        // Store JWT in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to frontend
        res.redirect("http://localhost:5173/");
    } catch (error) {
        console.error("Google callback error:", error);

        res.status(500).json({
            message: "Google authentication failed",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            message: "User fetched successfully",
            success: true,
            user: {
                id: user._id,
                _id: user._id,
                email: user.email,
                contact: user.contact || "",
                fullname: user.fullname,
                role: user.role,
                profilepic: user.profilepic || "",
                bio: user.bio || "",
                addresses: user.addresses || [],
                preferences: user.preferences || {
                    emailNotifications: true,
                    smsUpdates: true,
                    twoFactor: false,
                    darkTheme: true
                },
                createdAt: user.createdAt
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, contact, bio, profilepic } = req.body;
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (fullname !== undefined) user.fullname = fullname;
        if (contact !== undefined) user.contact = contact;
        if (bio !== undefined) user.bio = bio;
        if (profilepic !== undefined) user.profilepic = profilepic;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                _id: user._id,
                email: user.email,
                contact: user.contact || "",
                fullname: user.fullname,
                role: user.role,
                profilepic: user.profilepic || "",
                bio: user.bio || "",
                addresses: user.addresses || [],
                preferences: user.preferences,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
    }
};

export const getAddresses = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select("addresses");
        return res.status(200).json({
            success: true,
            addresses: user?.addresses || []
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, pincode, landmark, isDefault, tag } = req.body;
        if (!fullName || !phone || !street || !city || !state || !pincode) {
            return res.status(400).json({ success: false, message: "Please fill all required address fields" });
        }

        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (isDefault || user.addresses.length === 0) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        user.addresses.push({
            fullName,
            phone,
            street,
            city,
            state,
            pincode,
            landmark: landmark || "",
            isDefault: isDefault || user.addresses.length === 0,
            tag: tag || "Home"
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            addresses: user.addresses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to add address" });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, phone, street, city, state, pincode, landmark, isDefault, tag } = req.body;

        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const addr = user.addresses.id(addressId);
        if (!addr) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
            addr.isDefault = true;
        } else if (isDefault === false) {
            addr.isDefault = false;
        }

        if (fullName !== undefined) addr.fullName = fullName;
        if (phone !== undefined) addr.phone = phone;
        if (street !== undefined) addr.street = street;
        if (city !== undefined) addr.city = city;
        if (state !== undefined) addr.state = state;
        if (pincode !== undefined) addr.pincode = pincode;
        if (landmark !== undefined) addr.landmark = landmark;
        if (tag !== undefined) addr.tag = tag;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            addresses: user.addresses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to update address" });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const wasDefault = user.addresses.id(addressId)?.isDefault;
        user.addresses.pull(addressId);

        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            addresses: user.addresses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to delete address" });
    }
};

export const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.addresses.forEach(a => {
            a.isDefault = a._id.toString() === addressId;
        });

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Default address updated",
            addresses: user.addresses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
        }

        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.password && currentPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Incorrect current password" });
            }
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to change password" });
    }
};

export const updatePreferences = async (req, res) => {
    try {
        const { preferences } = req.body;
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.preferences = { ...user.preferences, ...preferences };
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Preferences updated successfully",
            preferences: user.preferences
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};