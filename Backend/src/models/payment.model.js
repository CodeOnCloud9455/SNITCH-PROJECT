import mongoose from "mongoose";
import priceSchema from "./price.schema.js";

const paymentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'failed'],
        default: 'pending',
    },
    price: {
        type: priceSchema,
        required: true,
    },
    razorpay: {
        orderId: String,
        paymentId: String,
        signature: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    orderItems: [{
        title: String,
        productId: mongoose.Schema.Types.Mixed,
        variantId: mongoose.Schema.Types.Mixed,
        quantity: Number,
        images: [{ url: String }],
        description: String,
        price: priceSchema,
    }],

    cancellation: {
        reason: String,
        comment: String,
        cancelledAt: Date,
        refundStatus: { 
            type: String, 
            enum: ['pending', 'processed', 'completed', 'na'], 
            default: 'pending' 
        },
        refundAmount: Number
    },

    returnRequest: {
        reason: String,
        action: { 
            type: String, 
            enum: ['refund', 'exchange'], 
            default: 'refund' 
        },
        exchangeSize: String,
        comment: String,
        requestedAt: Date,
        status: { 
            type: String, 
            enum: ['requested', 'approved', 'pickup_scheduled', 'completed', 'rejected'], 
            default: 'requested' 
        },
        pickupAddress: String
    }
}, { timestamps: true });

const paymentModel = mongoose.model("payment", paymentSchema);

export default paymentModel;