import catchAsync from "../../utils/catchAsync.js";
import Gateway from "../gateway/gateway.model.js";
import Order from "./order.model.js";
import { processPaymentGateway } from "./payment.service.js";

// Helper function to check date and reset limits dynamically
const checkAndResetDailyLimits = async () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Find if there are any gateways whose lastResetDate is not today
    const needsReset = await Gateway.exists({ lastResetDate: { $ne: today } });

    if (needsReset) {
        console.log(`[System] New day detected (${today}). Resetting gateway volumes to 0.`);

        await Gateway.updateMany(
            { lastResetDate: { $ne: today } },
            {
                $set: {
                    currentVolume: 0,
                    lastResetDate: today
                }
            }
        );
    }
};

export const createPaymentSession = catchAsync(async (req, res) => {
    const { name, email, amount, orderType, packageDetails, customPurpose } = req.body;

    await checkAndResetDailyLimits();

    // ১. Find the best active gateway based on limits and priority
    const selectedGateway = await Gateway.findOne({
        isActive: true,
        $expr: { $lt: ["$currentVolume", "$limit"] }
    }).sort({ priority: 1 });

    if (!selectedGateway) {
        return res.status(400).json({
            success: false,
            message: "All payment gateways are currently overloaded or unavailable."
        });
    }

    // ২. Create the pending order in the database
    const newOrder = await Order.create({
        customerInfo: { name, email },
        orderType,
        packageDetails,
        customPurpose,
        amount,
        paymentGatewayUsed: selectedGateway.name, // Will be 'STRIPE', 'PAYPAL' or 'ANTOM'
        paymentStatus: 'PENDING'
    });

    try {
        // ৩. Process the payment dynamically based on the selected gateway
        const paymentDetails = await processPaymentGateway(
            selectedGateway.name,
            newOrder._id,
            amount,
            newOrder.customerInfo,
            packageDetails
        );

        // ৪. Update the order with transaction ID
        newOrder.transactionId = paymentDetails.transactionId;
        await newOrder.save();

        // ৫. Return the unified checkout URL to Next.js
        res.status(200).json({
            success: true,
            message: "Order created successfully",
            checkoutUrl: paymentDetails.checkoutUrl,
            orderId: newOrder._id,
            gatewayUsed: selectedGateway.name
        });

    } catch (error) {
        newOrder.paymentStatus = 'FAILED';
        await newOrder.save();

        console.error(`Error with ${selectedGateway.name} Gateway:`, error.message);
        return res.status(500).json({
            success: false,
            message: `Failed to initialize payment with ${selectedGateway.name}. Please try again.`
        });
    }
});

// Universal payment completion and volume tracking handler
export const confirmPaymentAndIncreaseVolume = async (orderId, gatewayName, transactionId) => {
    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus === 'PAID') {
        return; // Already paid or not found
    }

    // 1. Update order status to PAID
    order.paymentStatus = 'PAID';
    order.transactionId = transactionId || order.transactionId;
    await order.save();

    // 2. Increment the current volume of the specific gateway used
    await Gateway.findOneAndUpdate(
        { name: gatewayName.toUpperCase() },
        { $inc: { currentVolume: order.amount } }
    );
};

// Endpoint for frontend capture (e.g., PayPal return)
export const capturePaymentController = catchAsync(async (req, res) => {
    const { orderId, token } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    await confirmPaymentAndIncreaseVolume(orderId, order.paymentGatewayUsed, token);

    res.status(200).json({
        success: true,
        message: "Payment captured and volume updated successfully"
    });
});