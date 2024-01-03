class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // Filtering
        const queryObj = { ...this.queryString };
        const excludingFields = ['limit', 'sort', 'page', 'fields'];
        excludingFields.forEach((el) => delete queryObj[el]);

        // Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte| gt|lte|lt)\b/g, (match) => {
            return `$${match}`;
        });
        this.query = this.query.find(JSON.parse(queryStr));

        return this; // this -> entire object containing both query & queryString.
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-ratingsAverage');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = JSON.stringify(this.queryString.fields)
                .split(',')
                .join(' ');
            this.query = this.query.select(JSON.parse(fields));
        } else {
            this.query = this.query.select('-__v'); // Not selecting __v. - Makes query not select __v.
        }
        return this;
    }

    pageignite() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 20;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
module.exports = APIFeatures