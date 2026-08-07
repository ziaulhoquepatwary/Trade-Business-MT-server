import mongoose from "mongoose";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import Portfolio from "./portfolio.model.js";

export const getPortfolios = catchAsync(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const { search, category, sortOrder } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { technologies: { $regex: search, $options: "i" } }
        ];
    }

    if (category) {
        query.category = category;
    }

    const sortCondition = {};
    if (sortOrder === 'asc') {
        sortCondition.category = 1;
    } else if (sortOrder === 'desc') {
        sortCondition.category = -1;
    } else {
        sortCondition.category = 1;
        sortCondition.createdAt = -1;
    }

    const portfolios = await Portfolio.find(query)
        .sort(sortCondition)
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Portfolio.countDocuments(query);

    return res.status(200).json({
        success: true,
        message: "Portfolios fetched successfully",
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit) || 1,
        },
        data: portfolios,
    });
});