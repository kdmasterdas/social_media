require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimiterRedis, RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const routes = require('./routes/identity-service');
const rateLimit = require('express-rate-limit');
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3001;

const app = express();


mongoose.connect(process.env.MONGODB_URI).then(
    () => logger.info("Connected to mongodb")
).catch(
    (e) => logger.error("Mongo connection error", e)
);

const redisClient = new Redis(process.env.REDIS_URL);



app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.info(`Rate limit exceeded of IP ${req.ip}`),
            res.status(429).json({ success: false, message: "Too many request" })
    });
});

const sensitiveEndPointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint ratelimit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many request" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
});

// apply sensitiveEndPointsLimiter to our routes

app.use('/api/auth/register', sensitiveEndPointsLimiter);

app.use('/api/auth', routes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on PORT: ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection on promise: ', promise, 'Reason:', reason);
});