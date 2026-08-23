import catchAsync from "../../utils/catchAsync.js";
import Gateway from "../gateway/gateway.model.js";
import Order from "./order.model.js";
import { processPaymentGateway } from "./payment.service.js";

export const createPaymentSession = catchAsync(async (req, res) => {
    const { name, email, amount, orderType, packageDetails, customPurpose } = req.body;

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