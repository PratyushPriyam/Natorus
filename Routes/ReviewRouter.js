const express = require('express');
const reviewController = require('../Controllers/reviewController');
const authController = require('../Controllers/authController')

const router = express.Router()

router.get('/', reviewController.getAllReviews)
router.post('/', authController.protect, authController.authorizeTo('tourist'), reviewController.addReview)

router.delete('/:id', authController.protect, reviewController.deleteReview)

module.exports = router