const mongoose = require('mongoose')
const fs = require('fs')
const dotenv = require('dotenv')
const Tour = require('../../Models/tourModel')

dotenv.config({ path: './config.env' })

const uploadData = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.MONGODB_PASSWORD)
mongoose.connect(DB).then(() => {
    console.log('Connection Successful')
}).catch((err) => {
    console.log(`Error is : ${err}`)
})

const importData = async () => {
    try {
        await Tour.create(uploadData)
        console.log('Data Successfully Uploaded')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

const deleteData = async () => {
    try {
        await Tour.deleteMany()
        console.log('Data Successfully Deleted')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

if (process.argv[2] === '--import') {
    importData()
}
else if (process.argv[2] === '--delete') {
    deleteData()
}

console.log(process.argv)