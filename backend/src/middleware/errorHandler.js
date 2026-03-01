/**
 * Global error handler middleware.
 * Catches all errors thrown in route handlers and sends a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors.map((e) => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            messages,
        });
    }

    // Sequelize optimistic lock error
    if (err.name === 'SequelizeOptimisticLockError') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'This record has been modified by another request. Please reload and try again.',
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.error || 'Error',
            message: err.message,
        });
    }

    // Fallback
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
};

module.exports = errorHandler;
