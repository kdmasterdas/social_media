const express = require('express');
const logger = require('../utils/logger');
const { createPost, getAllPost, getPostByUser } = require('../controllers/post-controller');
const { authenticateRequest } = require('../middleware/authMiddleware');

router = express.Router();

router.use(authenticateRequest);

router.post('/create-post', createPost);

router.get('/all-posts', getAllPost);

router.get('/posts-per-user', getPostByUser);

// router.get('/post-details', getPostDetails);

// router.delete('/delete-post', deletePost);


module.exports = router;