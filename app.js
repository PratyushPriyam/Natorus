const express = require('express');
const { log } = require('console');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitizs = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp') // HTTP parameter pollution library
const tourRouter = require('./Routes/TourRouter')
const userRouter = require('./Routes/UserRouter')
const reviewRouter = require('./Routes/ReviewRouter')

const app = express();

app.use(helmet()) // always put helmet at top in middlewarer stack. Sets security http headers.

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // 3rd party middleware
}

// Global middleware for controlling number of requests per hour from same IP address
const limiter = rateLimiter({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. try after 1 hour'
});

app.use('/api', limiter) // applies this middleware to all paths starting with '/api'. In this case, all routes start with '/api'.


app.use(express.json({ limit: '10kb' })); // Body parser. Reading data from body into req.body. Limit makes sure that-
// if body contains data more than 10kilo-byte, then it will not pe parsed and forworded for further processing.

// Data sanitization against NoSQL query injection
app.use(mongoSanitizs()); // Removes all '$' and '.' symbols from body, query and params so that mongoDb commands can no longer be executed from these places.

// Data sanitization against XSS i.e. cross side scripting attacks
app.use(xss()); // Removes malicious HTML codes to which javascript codes may be attached.

// Prevent parameter pollution. Use it atend because it clears up query string
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}));

// Getting static files.
app.use(express.static(`${__dirname}/public`))


app.use('/api/v1/tours', tourRouter); // This step is 'Mounting the Router'. Should be done at last
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// In case the user requests a route that has not been defined. EX: https://www.googleee.com
// The logic behind putting this middleware at the end is that middlewares execute in order of their declarations. So,
// if we reach the end of the middleware stack without encountering other middlware on the way, it means that the entered 
// path in invalid and does not match any middleware.
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Cant't find ${req.originalUrl} on the server.`
    })
})


// // GLOBAL ERROR HANDLING MIDDLEWARE
// app.use((err, req, res, next) => {
//     err.statusCode = err.statusCode || 500; // 500 -> Internal Server Error.
//     err.status = err.status || 'error'

//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message
//     })
// })

module.exports = app;