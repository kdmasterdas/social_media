require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimiterRedis, RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
// const { RedisStore } = require('rate-limit-redis');
const postRoutes = require('./routes/post-service');
// const rateLimit = require('express-rate-limit');
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3002;

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

app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Post service running on PORT: ${PORT}`);
});
