/**
 * Creates a validation middleware using a Joi schema.
 * Validates request body, query, or params based on the property specified.
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message);
            return res.status(400).json({
                error: 'Validation Error',
                messages,
            });
        }

        // Replace with sanitized values
        req[property] = value;
        next();
    };
};

module.exports = validate;
