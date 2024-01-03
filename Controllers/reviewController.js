const Review = require("../Models/reviewModel");
const { findById } = require("../Models/userModel");

exports.addReview = async (req, res, next) => {
    if (!req.body.user) req.body.user = req.user.id // req.user cones from authController.protect route
    if (!req.body.tour) req.body.tour = req.params.tourId
    try {
        const newReview = await Review.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                review: newReview
            }
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.getAllReviews = async (req, res, next) => {
    try {
        let filter = {}
        console.log(req.params.tourId)
        if (req.params.tourId) {
            filter = { tour: req.params.tourId }
        }
        const reviews = await Review.find(filter);

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: {
                reviews
            }
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
}

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id)

        if (!review) {
            res.status(404).json({
                status: 'fail',
                message: 'No review found'
            })
        }
        res.status(200).json({
            status: 'success',
            data: null
        })
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: err
        })
    }
}