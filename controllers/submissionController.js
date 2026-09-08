const pool = require("../db/database");
const { getGeoLocation } = require("../services/geoService");
const {
  sendSubmissionSideEffect
} = require("../services/sideEffectService");

async function createSubmission(req, res) {
  try {
    const { widget_id, form_data, website } = req.body;

    // Honeypot spam protection
    if (website && website.trim() !== "") {
      return res.status(400).json({
        error: "Invalid submission"
      });
    }

    // Validate widget ID
    if (!widget_id || typeof widget_id !== "string") {
      return res.status(400).json({
        error: "Widget ID is required"
      });
    }

    // Validate form data
    if (
      !form_data ||
      typeof form_data !== "object" ||
      Array.isArray(form_data)
    ) {
      return res.status(400).json({
        error: "Form data is required"
      });
    }

    // Check whether widget exists
    const widgetResult = await pool.query(
      `SELECT id, user_id
       FROM widgets
       WHERE id = $1`,
      [widget_id]
    );

    if (widgetResult.rows.length === 0) {
      return res.status(404).json({
        error: "Widget not found"
      });
    }

    const widget = widgetResult.rows[0];

    // Get visitor IP
    const ip = req.ip || null;

    // Geo enrichment
    // If both providers fail, submission still continues.
    let geo = null;

    try {
      geo = await getGeoLocation(ip);
    } catch (error) {
      console.error(
        "Geo enrichment failed:",
        error.message
      );
    }

    // Save submission
    const result = await pool.query(
      `INSERT INTO submissions
       (widget_id, user_id, form_data, ip_address, country, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, widget_id, form_data, ip_address, country, city, created_at`,
      [
        widget.id,
        widget.user_id,
        JSON.stringify(form_data),
        ip,
        geo ? geo.country : null,
        geo ? geo.city : null
      ]
    );

    const submission = result.rows[0];

// Run side effect in background.
// Failure here must not affect the submission response.
setImmediate(() => {
  sendSubmissionSideEffect(submission)
    .then(() => {
      console.log("✅ Side effect completed");
    })
    .catch((error) => {
      console.error(
        "⚠️ Side effect failed:",
        error.message
      );
    });
});

return res.status(201).json({
  message: "Submission received successfully",
  submission
});
  } catch (error) {
    console.error(
      "Create submission error:",
      error.message
    );

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

module.exports = {
  createSubmission
};