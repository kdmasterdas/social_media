const logger = require('../utils/logger');
const { validatePost } = require("../utils/validation");
const Post = require('../models/Post');

const createPost = async (req, res) => {
    logger.info("Post controller hit ...");
    try {
        logger.info("request body in controller:", req.body);
        const { post_name, post_description, mediaIds } = req.body;
        const { error } = validatePost(req.body);
        if (error) {
            logger.warn('Validation Error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const post = new Post({
            user: req.user.userId,
            post_name,
            post_description,
            mediaIds: mediaIds || []
        });

        await post.save();

        logger.warn('Post created successfully', post._id);

        res.status(200).json({
            success: true,
            message: "Successfully created the post."
        })

    } catch (err) {
        logger.error("Error creating post", err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


const getAllPost = async (req, res) => {
    logger.info("Post controller getPost hit ...");
    try {
        logger.info("request body in post controller:", req.body);
        const posts = await Post.find({});

        logger.warn('fetch posts', posts);

        res.status(200).json({
            success: true,
            allPost: posts
        });

    } catch (err) {
        logger.error("Error creating post", err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


const getPostByUser = async (req, res) => {
    logger.info("Post controller getPost hit ...");
    try {
        logger.info("request body in post controller:", req.headers);
        const posts = await Post.find({ user: req.headers['x-user-id'] });

        logger.warn('fetch posts', posts);

        res.status(200).json({
            success: true,
            allPost: posts
        });

    } catch (err) {
        logger.error("Error creating post", err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

module.exports = { createPost, getAllPost, getPostByUser }