const logger = require('../utils/logger');

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        logger.warn("Unautorized access attempted");
        return res.status(429).json({
            success: false,
            message: 'Unauthorized access'
        });
    }

    req.user = { userId };
    next();
}

module.exports = { authenticateRequest };