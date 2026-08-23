import mongoose from "mongoose";

const gatewaySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            uppercase: true, // e.g., 'PAYPAL', 'STRIPE', 'ATOM'
        },
        priority: {
            type: Number,
            required: true,
            unique: true, // Ensures no two gateways have the same priority (e.g., 1, 2, 3)
        },
        limit: {
            type: Number,
            required: true,
            default: 5000
        },
        currentVolume: {
            type: Number,
            required: true,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Gateway = mongoose.model("Gateway", gatewaySchema);
export default Gateway;