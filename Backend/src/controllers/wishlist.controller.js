import wishlistModel from "../models/wishlist.model.js";
import productModel from "../models/product.model.js";

// Helper to normalize product/item IDs
const getItemId = (item) => {
    if (!item) return "";
    if (typeof item === "object") {
        return (item._id || item.id || item.product || "").toString();
    }
    return item.toString();
};

export const getWishlist = async (req, res) => {
    try {
        let wishlist = await wishlistModel.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = await wishlistModel.create({ user: req.user._id, items: [] });
        }

        return res.status(200).json({
            message: "Wishlist retrieved successfully",
            success: true,
            wishlist
        });
    } catch (error) {
        console.error("Get wishlist error:", error);
        return res.status(500).json({
            message: error.message || "Failed to retrieve wishlist",
            success: false
        });
    }
};

export const toggleWishlist = async (req, res) => {
    try {
        const { product, productId } = req.body;
        const effectiveId = productId || (product && (product._id || product.id));

        if (!effectiveId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false
            });
        }

        let wishlist = await wishlistModel.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = await wishlistModel.create({ user: req.user._id, items: [] });
        }

        const existingIdx = wishlist.items.findIndex(
            it => getItemId(it.product) === effectiveId.toString()
        );

        let isAdded = false;

        if (existingIdx > -1) {
            // Remove
            wishlist.items.splice(existingIdx, 1);
            isAdded = false;
        } else {
            // Add
            const title = product?.title || "Product";
            const image = product?.images?.[0] || product?.image || "";
            const price = product?.price || { amount: 1499, currency: "INR" };
            const selectedSize = product?.selectedSize || "M";
            const badge = product?.badge || "NEW";

            wishlist.items.unshift({
                product: effectiveId,
                title,
                image,
                price,
                selectedSize,
                badge,
                addedAt: new Date()
            });
            isAdded = true;
        }

        await wishlist.save();

        return res.status(200).json({
            message: isAdded ? "Item added to wishlist" : "Item removed from wishlist",
            success: true,
            isAdded,
            wishlist
        });
    } catch (error) {
        console.error("Toggle wishlist error:", error);
        return res.status(500).json({
            message: error.message || "Failed to toggle wishlist",
            success: false
        });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const targetId = productId || req.body.productId;

        let wishlist = await wishlistModel.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.status(200).json({
                message: "Wishlist is empty",
                success: true,
                wishlist: { items: [] }
            });
        }

        if (targetId) {
            wishlist.items = wishlist.items.filter(
                it => getItemId(it.product) !== targetId.toString()
            );
            await wishlist.save();
        }

        return res.status(200).json({
            message: "Item removed from wishlist",
            success: true,
            wishlist
        });
    } catch (error) {
        console.error("Remove from wishlist error:", error);
        return res.status(500).json({
            message: error.message || "Failed to remove from wishlist",
            success: false
        });
    }
};

export const clearWishlist = async (req, res) => {
    try {
        let wishlist = await wishlistModel.findOne({ user: req.user._id });
        if (wishlist) {
            wishlist.items = [];
            await wishlist.save();
        }

        return res.status(200).json({
            message: "Wishlist cleared successfully",
            success: true,
            wishlist: wishlist || { items: [] }
        });
    } catch (error) {
        console.error("Clear wishlist error:", error);
        return res.status(500).json({
            message: error.message || "Failed to clear wishlist",
            success: false
        });
    }
};
