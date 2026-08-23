import catchAsync from "../../utils/catchAsync.js";
import { confirmPaymentAndIncreaseVolume } from "./order.controller.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId || session.client_reference_id;

        if (orderId) {
            await confirmPaymentAndIncreaseVolume(orderId, 'STRIPE', session.payment_intent);
        }
    }

    res.status(200).json({ received: true });
});

export const handleAntomWebhook = catchAsync(async (req, res) => {
    const body = req.body;
    const orderId = body.paymentRequestId;
    const paymentStatus = body.paymentStatus || body.result?.resultStatus;
    const paymentId = body.paymentId || body.transactionId;

    const isSuccessful = paymentStatus === 'SUCCESS' || paymentStatus === 'S';

    if (isSuccessful && orderId) {
        await confirmPaymentAndIncreaseVolume(orderId, 'ANTOM', paymentId);
    }

    res.status(200).json({
        result: { resultStatus: "S" }
    });
});