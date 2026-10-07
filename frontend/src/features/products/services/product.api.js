import axios from "axios";

const productApiInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api/products`,
    withCredentials: true,
});

export async function createProduct(formData) {
    const response = await productApiInstance.post("/", formData);

    return response.data;
}

export async function getSellerProduct() {
    const response = await productApiInstance.get("/seller");

    return response.data;
}

export async function getAllProducts() {
    const response = await productApiInstance.get("/");
    return response.data;    
}  

export async function getProductById(id) {
    const response = await productApiInstance.get(`/${id}`);
    return response.data;
}

export async function createVariant(productId, variantData) {
    // Check if variantData is FormData
    const isFormData = variantData instanceof FormData;
    const response = await productApiInstance.post(
        `/${productId}/variants`,
        variantData,
        isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    );
    return response.data;
}

export async function updateVariantStock(productId, variantId, { stock, delta }) {
    const response = await productApiInstance.patch(
        `/${productId}/variants/${variantId}/stock`,
        { stock, delta }
    );
    return response.data;
}

export async function deleteVariant(productId, variantId) {
    const response = await productApiInstance.delete(`/${productId}/variants/${variantId}`);
    return response.data;
}