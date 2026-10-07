import productModel from "../models/product.model";


export const stockOfVariant = async (productId, varientId) => {
    const product = await productModel.findOne({
        _id: productId,
        "varients._id": varientId
    })
    const varient = product.varients.find(v => v._id.toString() === varientId).stock
    return stock;
}
