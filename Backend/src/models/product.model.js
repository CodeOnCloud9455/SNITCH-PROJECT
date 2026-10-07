import mongoose from 'mongoose';
import priceSchema from './price.schema.js';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
     
        type: priceSchema,
        required: true
},
    images: [
        {
            url: {
                type: String,
                required: true
            }
        }
    ],
    varients: [
        {
            images: [
                {
                    url: {
                        type: String
                    }
                }
            ],
            stock: {
                type: Number,
                default: 0
            },
            attributes: {
                type: Map,
                of: String,
                validate: {
                    validator: function(val) {
                        if (!val) return false;
                        if (val instanceof Map) return val.size > 0;
                        if (typeof val === 'object') return Object.keys(val).length > 0;
                        return false;
                    },
                    message: "At least one attribute is required"
                }
            },
            price: {
                
                type: priceSchema,
                
            }
        }
    ]
}, { timestamps: true })

const productModel = mongoose.model('product', productSchema);

export default productModel;