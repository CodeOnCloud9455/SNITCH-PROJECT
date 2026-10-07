import mongoose from 'mongoose';
import priceSchema from './price.schema.js';

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.Mixed, // Can be ObjectId or string ID
                ref: 'Product',
                required: true
            },
            varient: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            selectedSize: {
                type: String,
                default: "M"
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
            price: {
                type: mongoose.Schema.Types.Mixed,
                default: () => ({ amount: 1499, currency: 'INR' })
            },
            title: {
                type: String,
                default: ""
            },
            image: {
                type: String,
                default: ""
            },
            stock: {
                type: Number,
                default: 10
            }
        }
    ],
}, { timestamps: true });

const cartModel = mongoose.model('cart', cartSchema);

export default cartModel;