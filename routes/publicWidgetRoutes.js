const express = require("express");
const { getPublicWidgetConfig } = require("../controllers/widgetController");

const router = express.Router();

router.get("/:id/config", getPublicWidgetConfig);

module.exports = router;