const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})

const app = require('./app')

const DB = process.env.DATABASE
mongoose.connect(DB,{})
.then((result) => console.log("DB connection Successful!"))
.catch((err) => console.log(err))

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`App is runnig on port ${port}...`)
})