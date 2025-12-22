require('dotenv').config();
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const rateLimits = require('express-rate-limit');
const errorHandler = require("./middleware/errorHandler");
const proxy = require('express-http-proxy');
const { validateToken } = require('./middleware/authMiddleware');

const PORT = process.env.PORT || 3001;

const app = express();

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
});


const rateLimit = rateLimits({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

app.use(rateLimit);

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy Error : ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
}

app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Identity Service ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Post Service ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

app.use(errorHandler);
app.listen(PORT, () => {
    logger.info(`API gateway running on PORT ${PORT}`);
});