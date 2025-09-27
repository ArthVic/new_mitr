import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";


export const checkoutRouter = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create order
checkoutRouter.post("/create-order",  authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { planName } = req.body;

    const amount =
      planName === "Starter" ? 499 :
      planName === "Growth" ? 1499 :
      planName === "Pro" ? 2999 : 0;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify payment
checkoutRouter.post("/verify-payment", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: "Verification error" });
  }
});
