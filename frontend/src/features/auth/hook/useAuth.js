import { useDispatch } from "react-redux";
import { setError, setLoding, setUser } from "../state/auth.slice";
import { register } from "../service/auth.api";
import { login } from "../service/auth.api";
import { getMe } from "../service/auth.api";


export const useAuth = () => {
    const dispatch = useDispatch();

    async function handleRegister({ email, contact, password, fullname, isSeller = false }) {
        try {
            dispatch(setLoding(true));
            const data = await register({ email, contact, password, fullname, isSeller });
            dispatch(setUser(data.user));
            return data.user;
        } catch (err) {
            dispatch(setError(err?.response?.data?.message || "Registration failed"));
        } finally {
            dispatch(setLoding(false));

        }
    }

    async function handleLogin({ email, password }) {
         const data = await login({ email, password })
         dispatch(setUser(data.user))
         return data.user
    }

    async function handleGetMe() {
        try{
        dispatch(setLoding(true));
        const data = await getMe()
        dispatch(setUser(data.user))
        } catch (err) {
            console.log(err)
        } finally {
            dispatch(setLoding(false));
        }
    }
    return { handleRegister, handleLogin, handleGetMe };


}
