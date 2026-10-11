import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const authApiInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    withCredentials: true,
});

export async function register({
    email,
    password,
    contact,
    fullname,
    isSeller,
}) {
    const response = await authApiInstance.post("/register", {
        email,
        contact,
        password,
        fullname,
        isSeller,
    });

    return response.data;
}

export async function login({ email, password }) {
    const response = await authApiInstance.post("/login", {
        email,
        password,
    });

    return response.data;
}

export async function getMe() {
    const response = await authApiInstance.get("/me");
    return response.data;
}

export async function updateProfileApi(data) {
    const response = await authApiInstance.put("/profile", data);
    return response.data;
}

export async function getAddressesApi() {
    const response = await authApiInstance.get("/addresses");
    return response.data;
}

export async function addAddressApi(address) {
    const response = await authApiInstance.post("/addresses", address);
    return response.data;
}

export async function updateAddressApi(addressId, address) {
    const response = await authApiInstance.put(`/addresses/${addressId}`, address);
    return response.data;
}

export async function deleteAddressApi(addressId) {
    const response = await authApiInstance.delete(`/addresses/${addressId}`);
    return response.data;
}

export async function setDefaultAddressApi(addressId) {
    const response = await authApiInstance.put(`/addresses/${addressId}/default`);
    return response.data;
}

export async function changePasswordApi(data) {
    const response = await authApiInstance.put("/password", data);
    return response.data;
}

export async function updatePreferencesApi(preferences) {
    const response = await authApiInstance.put("/preferences", { preferences });
    return response.data;
}