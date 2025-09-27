import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

export const subscriptionRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ✅ Create subscription (for recurring payments)
subscriptionRouter.post("/create", async (req, res) => {
  try {
    const { planId, customerNotify } = req.body;

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId, // must be created in Razorpay Dashboard
      customer_notify: customerNotify ?? 1,
      total_count: 12, // number of billing cycles (example: 12 months)
    });

    res.json(subscription);
  } catch (err: any) {
    console.error("Subscription creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify payment (after success on frontend)
subscriptionRouter.post("/verify", async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err: any) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: err.message });
  }
});
