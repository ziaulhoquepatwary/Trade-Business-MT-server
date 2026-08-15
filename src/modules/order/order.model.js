import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        customerInfo: {
            name: { type: String, default: 'Guest' },
            email: { type: String, default: 'Not Provided' }
        },
        orderType: {
            type: String,
            enum: ['PACKAGE_ORDER', 'ADVANCE_PAYMENT'],
            required: true
        },
        packageDetails: {
            slug: { type: String },
            tier: { type: String },
            title: { type: String }
        },
        customPurpose: {
            type: String
        },
        amount: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
            default: 'PENDING'
        },
        paymentGatewayUsed: {
            type: String,
            enum: ['PAYPAL', 'STRIPE', 'NONE'],
            default: 'NONE'
        },
        transactionId: {
            type: String
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;