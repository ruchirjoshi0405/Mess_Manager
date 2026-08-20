import e from "express"
import Razorpay from "razorpay"

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
})

export default razorpayInstance