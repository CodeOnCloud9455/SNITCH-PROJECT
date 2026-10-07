import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
    },
    reducers: {
        setItems: (state, action) => {
            state.items = action.payload || [];
        },
        addItem: (state, action) => {
            const newItem = action.payload;
            if (!newItem) return;
            const newItemId = newItem._id || newItem.id;
            const newItemSize = newItem.selectedSize || "M";
            const newItemVariant = newItem.variantId || "";

            const existingIdx = state.items.findIndex(
                item => (item._id || item.id) === newItemId &&
                        (item.variantId || "") === newItemVariant &&
                        (item.selectedSize || "M") === newItemSize
            );

            if (existingIdx > -1) {
                state.items[existingIdx].quantity = (state.items[existingIdx].quantity || 1) + (newItem.quantity || 1);
            } else {
                state.items.push(newItem);
            }
        },
        removeItem: (state, action) => {
            const index = action.payload;
            state.items.splice(index, 1);
        },
        updateQuantity: (state, action) => {
            const { index, quantity, item } = action.payload;
            if (state.items[index]) {
                if (quantity !== undefined) {
                    state.items[index].quantity = quantity;
                }
                if (item) {
                    state.items[index] = { ...state.items[index], ...item };
                }
            }
        },
        clearCart: (state) => {
            state.items = [];
        }
    }
});

export const { setItems, addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;