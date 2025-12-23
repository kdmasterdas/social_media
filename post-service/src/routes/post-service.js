const express = require('express');
const logger = require('../utils/logger');
const { createPost, getAllPost, getPostByUser, getPostDetails } = require('../controllers/post-controller');
const { authenticateRequest } = require('../middleware/authMiddleware');

router = express.Router();

router.use(authenticateRequest);

router.post('/create-post', createPost);

router.get('/all-posts', getAllPost);

router.get('/posts-per-user', getPostByUser);

router.get('/:id', getPostDetails);

// router.delete('/delete-post', deletePost);


module.exports = router;