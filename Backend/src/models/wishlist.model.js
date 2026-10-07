import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.Mixed,
                ref: 'Product',
                required: true
            },
            title: {
                type: String,
                default: ""
            },
            image: {
                type: String,
                default: ""
            },
            price: {
                type: mongoose.Schema.Types.Mixed,
                default: () => ({ amount: 1499, currency: 'INR' })
            },
            selectedSize: {
                type: String,
                default: "M"
            },
            badge: {
                type: String,
                default: "NEW"
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

const wishlistModel = mongoose.model('wishlist', wishlistSchema);

export default wishlistModel;
