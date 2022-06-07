const fs = require('fs')
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const cors = require('cors')
const cookieParser = require('cookie-parser')
// const { default: rateLimit } = require('express-rate-limit');
// const { default: helmet } = require('helmet');
// const ExpressMongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const hpp = require('hpp');

const docRouter = require('./routes/docRoutes')
const userRouter = require('./routes/userRouter')

const app = express();

// security middleware
// app.use(helmet());

// Middleware
// Third party Middkeware  --> this shows the proper req made in log
app.use(morgan('dev'));

// Limit the number of request to prevent Bruteforce attack
// const limiter = rateLimit({
//     max: 100,
//     windowMs: 60 * 60 * 1000,
//     message: 'Too may requests from this IP, please try again in an hour!'
// });
// app.use('/api', limiter);

// this middleware helps us to get req body
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NoSQL query injection
// app.use(ExpressMongoSanitize());

// Data sanitization against XSS.
// app.use(xss());

//prevent parameter pollution
// app.use(hpp({
//     whitelist: [
//         'duration',
//         'ratingsQuantity',
//         'ratingsAverage',
//         'maxGroupSize',
//         'difficulty',
//         'price'
//     ]
// }));

// serving static files
app.use(express.static(`${__dirname}/public`));

// custom Middleware
// app.use((req, res, next) => {
//     console.log("Hello from Middleware !")
//     next();
// })

// Routes
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: 'true',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "http://localhost:3000");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type,Authorization, Accept');
    next();
});

app.use(cors(corsOptions))
app.use(cookieParser())

app.use('/api/v1/document', docRouter);
app.use('/api/v1/user', userRouter);

// app.use('/api/v1/users', userRouter);



// Unhandled Routes 404
app.all('*', (req, res, next) => {
    next(new AppError(`Invalid Path (${req.originalUrl})`, 404));
});

// Global error handling Middleware
app.use(globalErrorHandler);

module.exports = app