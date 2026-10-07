import { param, body, validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const validateAddToCart = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    param('varientId').isMongoId().withMessage('Invalid varient ID'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validateRequest
];

export const validateIncrementCartItemQuantity = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    param('varientId').isMongoId().withMessage('Invalid varient ID'),
    validateRequest
];