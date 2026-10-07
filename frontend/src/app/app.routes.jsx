import { createBrowserRouter } from "react-router";
import Register from "../features/auth/pages/Register.jsx";
import Login from "../features/auth/pages/Login.jsx";
import CreateProduct from "../features/seller/pages/CreateProduct.jsx";
import SellerDashboard from "../features/seller/pages/SellerDashboard.jsx";
import Dashboard from "../features/products/pages/Dashboard.jsx";
import Protected from "../features/auth/components/Protected.jsx";
import Home from "../features/products/pages/Home.jsx";
import SellerProductDetails from "../features/products/pages/SellerProductDetails.jsx";
import ProductDetail from "../features/products/pages/ProductDetail.jsx";
import Cart from "../features/cart/pages/Cart.jsx";
import OrderSuccess from "../features/cart/pages/OrderSuccess.jsx";
import WishlistPage from "../features/products/pages/WishlistPage.jsx";
import Profile from "../features/auth/pages/Profile.jsx";
import AppLayout from "./AppLayout.jsx";

export const routes = createBrowserRouter([
    
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/login",
        element: <Login />,

    },
    {
        element: <AppLayout />,
        children: [
             {
        path: "/",
        element: <Home />,
    },
    {
        path: "/product/:productId",
        element: <ProductDetail />,

    },
    {
        path: "/cart",
        element: <Cart />,
    },
    {
        path: "/order-success",
        element: <OrderSuccess />,
    },
    {
        path: "/wishlist",
        element: <WishlistPage />,
    },
    {
        path: "/profile",
        element: <Protected><Profile /></Protected>,
    },
    // Top-level /dashboard — Google OAuth redirects here after login
    {
        path: "/dashboard",
        element: <Dashboard />,
    },
    {
        path: "/seller",
        children: [
            {
                path: "create-product",
                element: <Protected role="seller"><CreateProduct /></Protected>,
            },
            {
                path: "dashboard",
                element: 
                   <Protected
                    role="seller">
                        <SellerDashboard />
                        </Protected>,
            },
            {
                path: "product/:productId",
                element: <Protected role="seller"><SellerProductDetails /></Protected>,
            },
            {
                path: "products/:productId",
                element: <Protected role="seller"><SellerProductDetails /></Protected>,
            },
        ],
    },
        ]
    }
   
    
]);
