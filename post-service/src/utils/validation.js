const Joi = require("joi");

const validatePost = (data) => {
    const schema = Joi.object({
        post_name: Joi.string().min(3).max(150).required(),
        post_description: Joi.string().min(3).max(600).required(),
    });

    return schema.validate(data);
};

module.exports = { validatePost };