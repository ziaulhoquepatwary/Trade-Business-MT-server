import catchAsync from "../../utils/catchAsync.js";
import Review from "./review.model.js";


export const getHomeTopReviews = catchAsync(async (req, res) => {
    const topReviews = await Review.find({ rating: 5 })
        .sort({ createdAt: -1 })
        .limit(8);

    res.status(200).json({
        success: true,
        message: "Top home page reviews fetched successfully",
        count: topReviews.length,
        data: topReviews
    });
});