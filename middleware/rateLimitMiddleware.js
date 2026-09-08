const rateLimit = require("express-rate-limit");

const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "Too many submissions. Please try again later."
  }
});

module.exports = submissionRateLimiter;