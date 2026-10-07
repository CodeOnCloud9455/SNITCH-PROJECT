import productModel from "../models/product.model.js";
import { uploadFile } from "../services/storage.service.js";

export async function createProduct(req, res) {
    try {
        const {
            title,
            description,
            priceAmount,
            priceCurrency
        } = req.body;

        const seller = req.user;

        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image is required"
            });
        }

        const images = await Promise.all(
            req.files.map(async (file) => {
                console.log("File buffer length:", file.buffer?.length);

                return await uploadFile({
                    buffer: file.buffer,
                    fileName: file.originalname
                });
            })
        );

        const product = await productModel.create({
            title,
            description,
            price: {
                amount: priceAmount,
                currency: priceCurrency || "INR"
            },
            images,
            seller: seller._id
        });

        return res.status(201).json({
            message: "Product created successfully",
            success: true,
            product
        });

    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getSellerProducts(req, res) {
    const seller = req.user;

    const products = await productModel.find({ seller: seller._id });

    res.status(200).json({
        message: "Products fetched successfully",
        success: true,
        products
    })
}

export async function getAllProducts(req, res) {
    const products = await productModel.find();

    res.status(200).json({
        message: "Products fetched successfully",
        success: true,
        products
    })
}

export async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            success: true,
            product
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function addVariant(req, res) {
    try {
        const { id } = req.params;
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = await Promise.all(
                req.files.map(async (file) => {
                    const uploaded = await uploadFile({
                        buffer: file.buffer,
                        fileName: file.originalname
                    });
                    return { url: uploaded.url };
                })
            );
        } else if (req.body.images) {
            const raw = typeof req.body.images === "string" ? JSON.parse(req.body.images) : req.body.images;
            images = (Array.isArray(raw) ? raw : [raw]).map(img => typeof img === "string" ? { url: img } : img);
        } else if (req.body.imageUrl) {
            images = [{ url: req.body.imageUrl }];
        }

        let attributes = {};
        if (req.body.attributes) {
            if (typeof req.body.attributes === "string") {
                try {
                    attributes = JSON.parse(req.body.attributes);
                } catch {
                    attributes = {};
                }
            } else {
                attributes = req.body.attributes;
            }
        }

        // Clean and validate attributes: at least one attribute is required
        const cleanAttributes = {};
        for (const [key, value] of Object.entries(attributes)) {
            if (key && key.trim() !== "" && value !== undefined && value !== null && String(value).trim() !== "") {
                cleanAttributes[key.trim()] = String(value).trim();
            }
        }

        if (Object.keys(cleanAttributes).length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one attribute is required (e.g. Color, Size, Storage, Voltage)"
            });
        }

        const stock = Number(req.body.stock) || 0;

        // Price is optional
        let price = undefined;
        if (req.body.priceAmount !== undefined && req.body.priceAmount !== "" && !isNaN(Number(req.body.priceAmount))) {
            price = {
                amount: Number(req.body.priceAmount),
                currency: req.body.priceCurrency || product.price?.currency || "INR"
            };
        } else if (req.body.price?.amount !== undefined && req.body.price?.amount !== "" && !isNaN(Number(req.body.price.amount))) {
            price = {
                amount: Number(req.body.price.amount),
                currency: req.body.price.currency || product.price?.currency || "INR"
            };
        }

        const newVariant = {
            images: (images || []).slice(0, 7),
            stock,
            attributes: cleanAttributes,
            ...(price ? { price } : {})
        };

        if (!product.varients) {
            product.varients = [];
        }

        product.varients.push(newVariant);
        await product.save();

        const savedVariant = product.varients[product.varients.length - 1];

        return res.status(201).json({
            success: true,
            message: "Variant added successfully",
            variant: savedVariant,
            product
        });
    } catch (error) {
        console.error("Add variant error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateVariantStock(req, res) {
    try {
        const { id, variantId } = req.params;
        const { stock, delta } = req.body;

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const variant = product.varients.id(variantId);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found"
            });
        }

        if (stock !== undefined && stock !== null) {
            variant.stock = Math.max(0, Number(stock));
        } else if (delta !== undefined) {
            variant.stock = Math.max(0, (variant.stock || 0) + Number(delta));
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Variant stock updated successfully",
            variant,
            product
        });
    } catch (error) {
        console.error("Update variant stock error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function deleteVariant(req, res) {
    try {
        const { id, variantId } = req.params;
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.varients.pull(variantId);
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Variant deleted successfully",
            product
        });
    } catch (error) {
        console.error("Delete variant error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
