const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

// CREATING MONGOOSE SCHEMA
const toursSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            trim: true,
            required: [true, 'A tour must have a name'], // 1st argument is boolean, 2nd is error if required field is left empty
        },
        slug: String,
        secretTour: {
            type: Boolean,
            default: false,
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a max group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Acceptable values are: easy, medium and difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4,
            required: false,
            min: [1, 'A tour must have a rating above or equal to 1.0'],
            max: [5, 'A tour must have a rating below or equal to 5.0'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                // "this" only points to NEW document creation. It does not work while updating documents.
                validator: function (val) {
                    return this.price > val; // val is the value held by priceDiscount.
                },
                message: 'Discount cannot be greater than actual price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // when false, it does not shot the selected field in the output. Could be used to hide sensitive info.
        },
        startDates: [Date],
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number], // accepts an array of numbers
            address: String,
            description: String,
        },
        // Creating embedded documents inside tour Schema
        locations: [
            // Embedded documents always lies in an array. Keepingit as an array, provides each embaded document with it's own id
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        // guides: Array -> use it if going for ebedding
        guides: [
            {
                type: mongoose.Schema.ObjectId, // fieldType: Id of objects
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// pre works before the specified parameter. Inthis case: 'save'. post works after the specified parameter.
// pre has access to 'this' keyword. this keyword refers tp the document being processed right at that moment.
// post does not have a "this" rather, it has access to a parameter in the function. function(doc, next) {}
// this doc refers to the document that was just processed.
// DOCUMENT MIDDLEWARE: runs before .save() & .create() NOT for UPDATE
toursSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// PERFORM EMBEDDING
// toursSchema.pre('save', async function (next) {
//     const guidePromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidePromises)
//      next()
// })

// QUERY MIDDLEWARE -> here, "this" keyword does not represent the document being processed, but the query being processed.
toursSchema.pre(/^find/, function (next) {
    this.find({
        secretTour: { $ne: true },
    });
    next();
});
// on using .post for query middleware, we get a set of documnets that have been processed.

// A pre query middleware to populate every path that uses a find query of any type
// This middleware populates the guides field by reference.
toursSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v',
    });
    next();
});

toursSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual Populate
toursSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // address from the Review model where reference of current moedl -> Tour is stored
    localField: '_id', // reference to current model -> Tour to connect Tour & Review
});

// AGGREGATION FUNCTION -> this points to the current aggregation object.
toursSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({
        $match: { $ne: true },
    });
    next();
});
// unshift adds at the begining of an array. Whereas, shift adds to the end of the array.

// CREATING MODEL
const Tour = mongoose.model('Tour', toursSchema);
// model name and model objects by convension are written with a starting upper case.

module.exports = Tour;
