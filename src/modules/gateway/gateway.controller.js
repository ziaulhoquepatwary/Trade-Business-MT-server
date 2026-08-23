import catchAsync from "../../utils/catchAsync.js";
import Gateway from "./gateway.model.js";

// Create a new gateway configuration
export const createGateway = catchAsync(async (req, res) => {
    const gateway = await Gateway.create(req.body);

    res.status(201).json({
        success: true,
        message: "Gateway created successfully",
        data: gateway
    });
});

// Get all gateways sorted by priority
export const getAllGateways = catchAsync(async (req, res) => {
    // Sorting by priority in ascending order (1 comes first, then 2, etc.)
    const gateways = await Gateway.find().sort({ priority: 1 });

    res.status(200).json({
        success: true,
        data: gateways
    });
});

// Update gateway settings (limit, isActive, priority, currentVolume)
export const updateGateway = catchAsync(async (req, res) => {
    const { id } = req.params;

    const updatedGateway = await Gateway.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedGateway) {
        return res.status(404).json({
            success: false,
            message: "Gateway not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Gateway updated successfully",
        data: updatedGateway
    });
});