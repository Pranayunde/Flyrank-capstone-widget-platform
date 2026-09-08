const express = require("express");

const {
  createWidget,
  getWidgets,
  getWidgetById,
  updateWidget,
  deleteWidget
} = require("../controllers/widgetController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, createWidget);

router.get("/", authenticateToken, getWidgets);

router.get("/:id", authenticateToken, getWidgetById);

router.put("/:id", authenticateToken, updateWidget);

router.delete("/:id", authenticateToken, deleteWidget);

module.exports = router;