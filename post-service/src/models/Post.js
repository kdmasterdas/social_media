const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post_name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    post_description: {
        type: String,
        required: true,
        trim: true
    },
    mediaIds: {
        type: Array,
    },
    is_active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

postSchema.index({ post_name: "text" });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;