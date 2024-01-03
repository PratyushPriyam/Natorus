const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({ path: './config.env' });
// console.log(process.env)

const app = require('./app')

const PORT = process.env.PORT || 5000

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.MONGODB_PASSWORD)
mongoose.connect(DB).then(con => {
    // console.log(con.connections)
    console.log("DataBase connection successful !!!")
}).catch(err => {
    console.log(err)
})


// // CREATING A DOCUMENT USING THE MODEL
// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 17000
// })
// testTour.save().then(doc => {
//     console.log(doc)
// }).catch(err => {
//     console.log(err)
// })

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});