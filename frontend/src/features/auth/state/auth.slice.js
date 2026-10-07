import { createSlice } from "@reduxjs/toolkit";



const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: true,
        error: null,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setLoding: (state, action) => {
            state.loading = action.payload;


        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    }
})

export const { setUser, setLoding, setError } = authSlice.actions;
export default authSlice.reducer;




