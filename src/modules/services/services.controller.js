import AppError from "../../utils/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import Service from "./services.model.js";


export const getAllServices = catchAsync(async (req, res) => {
    const services = await Service.find().sort({ createdAt: 1 });

    return res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: services
    });
});

export const getServiceBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;

    const service = await Service.findOne({ slug });

    if (!service) {
        throw new AppError(404, `No service found with slug: ${slug}`);
    }

    return res.status(200).json({
        success: true,
        message: 'Service retrieved successfully',
        data: service
    });
});

export const getServiceCategories = catchAsync(async (req, res) => {
    const categories = await Service.find().select('name slug categoryIcon shortDescription');

    return res.status(200).json({
        success: true,
        message: 'Service categories retrieved successfully',
        data: categories
    });
});