const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        details: 'Please try again after 15 minutes'
    }
});

const downloadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 downloads per hour
    message: {
        error: 'Download limit exceeded',
        details: 'Please try again after an hour'
    }
});

module.exports = {
    apiLimiter,
    downloadLimiter
}; 