const express = require("express");
const { createSubmission } = require("../controllers/submissionController");

const router = express.Router();

router.post("/", createSubmission);

module.exports = router;