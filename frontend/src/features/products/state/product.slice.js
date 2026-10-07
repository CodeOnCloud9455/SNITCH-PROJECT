import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name: "product",
    initialState: {
        products: [],
        sellerProducts: [],
        product: null,
        loading: false,
        error: null,
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setSellerProducts: (state, action) => {
            state.sellerProducts = action.payload;
        },
        setProducts: (state, action) => {
            state.products = action.payload;
        },
        setProduct: (state, action) => {
            state.product = action.payload;
        }
    }
})

export const { setSellerProducts, setProducts, setProduct, setLoading, setError } = productSlice.actions

export default productSlice.reducer