import { 
    createProduct, 
    getSellerProduct, 
    getAllProducts, 
    getProductById,
    createVariant,
    updateVariantStock,
    deleteVariant
} from "../services/product.api";
import { useDispatch } from "react-redux";
import { setSellerProducts, setProducts, setProduct, setLoading, setError } from "../state/product.slice";
import { CURATED_COLLECTION } from "../utils/curatedCollections";
import { getSafeId } from "../utils/formatters";

export const useProduct = () => {
    const dispatch = useDispatch();

    async function handleCreateProduct(formData) {
        const data = await createProduct(formData);
        return data.product;
    }

    async function handleGetSellerProduct() {
        try {
            dispatch(setLoading(true));
            const data = await getSellerProduct();
            const products = Array.isArray(data) ? data : (data?.products || []);
            dispatch(setSellerProducts(products));
            return products;
        } catch (error) {
            console.error("Error fetching seller products:", error);
            dispatch(setError(error?.response?.data?.message || "Failed to fetch seller products"));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetAllProducts() {
        try {
            dispatch(setLoading(true));
            const data = await getAllProducts();
            const products = Array.isArray(data) ? data : (data?.products || []);
            dispatch(setProducts(products));
            return products;
        } catch (error) {
            console.error("Error fetching all products:", error);
            dispatch(setError(error?.response?.data?.message || "Failed to fetch products"));
            return [];
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetProductById(id) {
        try {
            dispatch(setLoading(true));
            let product = null;
            try {
                const data = await getProductById(id);
                product = data?.product || null;
            } catch (err) {
                // Ignore API error and fallback below
            }

            if (!product) {
                const cleanId = getSafeId(id);
                product = CURATED_COLLECTION.find((p) => getSafeId(p._id || p.id) === cleanId) || null;
            }

            if (product) {
                dispatch(setProduct(product));
            }
            return product;
        } catch (error) {
            console.error("Error fetching product by id:", error);
            dispatch(setError(error?.response?.data?.message || "Failed to fetch product"));
            return null;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleCreateVariant(productId, variantData) {
        try {
            const data = await createVariant(productId, variantData);
            return data?.product || null;
        } catch (error) {
            console.error("Error creating variant:", error);
            throw error;
        }
    }

    async function handleUpdateVariantStock(productId, variantId, { stock, delta }) {
        try {
            const data = await updateVariantStock(productId, variantId, { stock, delta });
            return data?.product || null;
        } catch (error) {
            console.error("Error updating variant stock:", error);
            throw error;
        }
    }

    async function handleDeleteVariant(productId, variantId) {
        try {
            const data = await deleteVariant(productId, variantId);
            return data?.product || null;
        } catch (error) {
            console.error("Error deleting variant:", error);
            throw error;
        }
    }

    return {
        handleCreateProduct,
        handleGetSellerProduct,
        handleGetAllProducts,
        handleGetProductById,
        handleCreateVariant,
        handleUpdateVariantStock,
        handleDeleteVariant
    }
}
