import mongoose from "mongoose";

const gatewaySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ['PAYPAL', 'STRIPE', 'AUTHORIZE_NET']
        },
        limit: {
            type: Number,
            required: true,
            default: 10000
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