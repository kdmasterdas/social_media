const logger = require('../utils/logger');
const { validatePost } = require("../utils/validation");
const Post = require('../models/Post');
const { parse } = require('dotenv');

const invalidateCache = async (req, input) => {
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    logger.info("cached keys: ", keys);
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
    logger.info("cached keys after delete: ", req.redisClient.keys("posts:*"));
}

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

        await invalidateCache(req, post._id.toString());

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;

        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        logger.info("request body in post controller:", req.body);
        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);

        const totalNoOfPost = await Post.countDocuments();

        logger.warn('fetch posts', posts);

        const result = {
            success: true,
            allPost: posts,
            totalNumberOfPage: Math.ceil(totalNoOfPost / limit),
            totalNoOfPost: totalNoOfPost
        }

        req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.status(200).json(result);

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
        });
    }
}

const getPostDetails = async (req, res) => {
    try {
        const postId = parseInt(req.query.id);

        if (!postId) {
            res.status(400).json({
                success: false,
                message: 'Missing Post Id'
            });
        }

        const cacheKey = `post:${postId}`;

        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        const postDetails = await Post.findById(postId);

        req.redisClient.setex(cacheKey, 3000, JSON.stringify(postDetails));

        res.status(200).json(postDetails);
    } catch (err) {
        logger.error("Error fetching post details", err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }

}

module.exports = { createPost, getAllPost, getPostByUser, getPostDetails }