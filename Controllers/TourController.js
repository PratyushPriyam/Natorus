const fs = require('fs');
const Tour = require('../Models/tourModel');
const { error } = require('console');
const APIFeatures = require('../Utils/APIFeatures');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkId = (req, res, next, val) => {
//     if (val >= tours.length) {
//         return res.status(404).json({
//             status: 'error',
//             message: 'No data found',
//         });
//     }
//     next()
// }

exports.getToursByMonths = async (req, res) => {
    try {
        const year = req.params.year * 1;
        const toursByMonths = await Tour.aggregate([
            {
                $unwind: '$startDates',
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                },
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: { $sum: 1 },
                    tours: { $push: '$name' }
                }
            },
            {
                $addFields: {
                    month: '$_id'
                }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {
                    numTourStarts: -1
                }
            },
            {
                $limit: 12
            }
        ]);
        res.status(200).json({
            status: 'success',
            numData: toursByMonths.length,
            data: {
                toursByMonths
            }
        })
    } catch (err) {
        req.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.getTourStats = async (req, res) => {
    try {
        const stats = await Tour.aggregate([
            {
                $match: { price: { $gte: 1000 } },
            },
            {
                $group: {
                    _id: { $toUpper: '$difficulty' },
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    averageRating: { $avg: '$ratingsAverage' },
                    averagePrice: { $avg: '$price' },
                    minPrice: { $min: 'price' },
                    maxPrice: { $max: 'price' },
                },
            },
            {
                $sort: { averagePrice: 1 },
            },
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.top5Routes = (req, res, next) => {
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,difficulty,summary,duration,price,ratingsAverage';
    req.query.limit = '5';
    next();
};

exports.getAllTours = async (req, res) => {
    try {
        // Execute Query
        const apiFeatures = new APIFeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .pageignite();
        const tours = await apiFeatures.query;

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours: tours,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.getTourById = async (req, res) => {
    try {
        const id = req.params.id;
        const tour = await Tour.findById(id).populate('reviews');
        if (!tour) {
            res.status(404).json({
                status: 'success',
                message: 'No tour found'
            })
        }
        res.status(200).json({
            status: 'success',
            data: {
                tour,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.addTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);
        res.status(200).json({
            status: 'success',
            data: {
                tour: newTour,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour: tour,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) {
            res.status(404).json({
                status: 'fail',
                data: null
            })
        }
        res.status(204).json({
            status: 'success',
            message: 'Deletion Successful',
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }
};
