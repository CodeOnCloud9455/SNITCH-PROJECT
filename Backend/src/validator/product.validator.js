import { body, validationResult } from "express-validator";

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.status(400).json({ message: "Validation error", error: errors.array()});
    }

    next();
}

export const createProductValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("description is required"),
    body("priceAmount").isNumeric().withMessage("price amount must be a number"),
    body("priceCurrency").notEmpty().withMessage("price currency is required"),
    validateRequest
]