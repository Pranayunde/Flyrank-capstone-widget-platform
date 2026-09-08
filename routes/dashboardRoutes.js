const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getSubmissions,
  getStats
} = require("../controllers/dashboardController");

const router = express.Router();

router.use(authMiddleware);

router.get("/submissions", getSubmissions);
router.get("/stats", getStats);

module.exports = router;