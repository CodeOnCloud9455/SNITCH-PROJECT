import Razorpay from "razorpay";
import { config } from "../config/config.js";

const getRazorpayInstance = () => {
    const key_id = (config.RAZORPAY_KEY_ID || "").replace(/=+$/, "").trim();
    const key_secret = (config.RAZORPAY_KEY_SECRET || "").trim();
    return new Razorpay({
        key_id,
        key_secret
    });
};

export const createOrder = async ({ amount = 1000, currency = "INR" }) => {
    const razorpay = getRazorpayInstance();
    const parsedAmount = Math.round(Number(amount) * 100); // amount in paise (must be an integer)

    const options = {
        amount: parsedAmount > 0 ? parsedAmount : 100000,
        currency,
        receipt: `receipt_${Date.now().toString().slice(-8)}`,
    };

    const order = await razorpay.orders.create(options);
    return order;
};