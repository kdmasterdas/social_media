const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');


const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1]; // bearer token
    if (!token) {
        logger.warn('Empty token');
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access.'
        })
    }
    logger.info("token: ", { token });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token', err);
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access...'
            })
        }

        req.user = user;
        next();
    });
}

module.exports = { validateToken };