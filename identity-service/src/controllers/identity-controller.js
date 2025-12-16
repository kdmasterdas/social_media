const logger = require('../utils/logger');
const { validateRegistration } = require("../utils/validation");
const User = require('../models/User');
const generateTokens = require("../utils/generateToken");


const registerUser = async (req, res) => {
    logger.info('Registration endpoint hit ...');
    // logger.info("check function", typeof validateRegistration);
    try {
        // const a_token = await generateTokens({
        //     _id: 1,
        //     username: 'KD'
        // });
        // return res.json({
        //     token: a_token
        // });
        // validate
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation Error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const { email, password, username } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            logger.warn('User already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.warn('User saved successfully', user._id);

        const { accessToken, refreshToken } = await generateTokens(user);

        return res.status(200).json({
            success: true,
            message: 'User created successfully',
            accessToken,
            refreshToken
        });

    } catch (err) {
        logger.error('Registration error occur', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

module.exports = { registerUser }