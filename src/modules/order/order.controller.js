import catchAsync from "../../utils/catchAsync.js";
import Gateway from "../gateway/gateway.model.js";
import Order from "./order.model.js";


const generatePayPalAccessToken = async () => {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
    const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
    });
    const data = await response.json();
    return data.access_token;
};

// Step 1: Create Order & Generate Payment Link
export const createPaymentSession = catchAsync(async (req, res) => {
    const { name, email, amount, orderType, packageDetails, customPurpose } = req.body;

    const selectedGateway = await Gateway.findOne({
        isActive: true,
        $expr: { $lt: ["$currentVolume", "$limit"] }
    });

    if (!selectedGateway) {
        return res.status(400).json({
            success: false,
            message: "No available payment gateways at the moment."
        });
    }

    const newOrder = await Order.create({
        customerInfo: { name, email },
        orderType,
        packageDetails,
        customPurpose,
        amount,
        paymentGatewayUsed: selectedGateway.name,
        paymentStatus: 'PENDING'
    });

    let checkoutUrl = '';

    if (selectedGateway.name === 'PAYPAL') {
        const accessToken = await generatePayPalAccessToken();

        const paypalOrderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{
                    reference_id: newOrder._id.toString(),
                    amount: { currency_code: "USD", value: amount.toString() }
                }],
                application_context: {
                    return_url: `${process.env.FRONTEND_URL}/payment-success?orderId=${newOrder._id}`,
                    cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled?orderId=${newOrder._id}`
                }
            })
        });

        const paypalOrderData = await paypalOrderRes.json();

        newOrder.transactionId = paypalOrderData.id;
        await newOrder.save();

        const approveLink = paypalOrderData.links.find(link => link.rel === 'approve');
        checkoutUrl = approveLink.href;
    }

    res.status(200).json({
        success: true,
        message: "Order created successfully",
        checkoutUrl,
        orderId: newOrder._id
    });
});

// Step 2: Capture Payment
export const capturePayPalPayment = catchAsync(async (req, res) => {
    const { token, orderId } = req.body;

    if (!token || !orderId) {
        return res.status(400).json({ success: false, message: "Missing token or orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.paymentStatus === 'PAID') {
        return res.status(200).json({ success: true, message: "Order not found or already paid" });
    }

    try {
        const accessToken = await generatePayPalAccessToken();

        const captureRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({})
        });

        const captureData = await captureRes.json();

        console.log("PayPal Capture Status:", captureData.status);

        if (captureData.status === 'COMPLETED' || captureData.status === 'APPROVED') {
            order.paymentStatus = 'PAID';
            order.transactionId = captureData.id || token;
            await order.save();

            await Gateway.findOneAndUpdate(
                { name: 'PAYPAL' },
                { $inc: { currentVolume: order.amount } }
            );

            return res.status(200).json({ success: true, message: "Payment captured successfully!" });

        } else if (captureData.status === 'PENDING') {
            order.paymentStatus = 'PAID';
            order.transactionId = captureData.id || token;
            await order.save();
            return res.status(200).json({ success: true, message: "Payment is pending review but accepted." });

        } else {
            order.paymentStatus = 'FAILED';
            await order.save();
            return res.status(400).json({ success: false, message: `Payment failed with status: ${captureData.status}` });
        }
    } catch (error) {
        console.error("Backend Capture Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error during capture" });
    }
});