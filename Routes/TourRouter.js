const express = require('express')
const tourController = require('../Controllers/TourController')
const authController = require('../Controllers/authController')
const reviewController = require('../Controllers/reviewController')


const router = express.Router();
// router.param('id', tourController.checkId) // Params work only if the id parameter is present in the request.
router
    .route('/top-5-tours')
    .get(tourController.top5Routes, tourController.getAllTours)

router
    .route('/tour-stats')
    .get(tourController.getTourStats)

router
    .route('/tours-monthly/:year')
    .get(tourController.getToursByMonths)

router
    .route('/')
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.addTour)

router
    .route('/:id')
    .get(tourController.getTourById)
    .patch(tourController.updateTour)
    .delete(authController.protect,
        authController.authorizeTo('admin', 'lead-guide'),
        tourController.deleteTour)

// Adding reviews for loggedin users (tourists)
router
    .route('/:tourId/review')
    .post(authController.protect, authController.authorizeTo('tourist'), reviewController.addReview)
    .get(reviewController.getAllReviews)

module.exports = router