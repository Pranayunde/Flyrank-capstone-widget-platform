const pool = require("../db/database");

async function getSubmissions(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, widget_id, form_data, ip_address, country, city, created_at
       FROM submissions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({
      submissions: result.rows
    });
  } catch (error) {
    console.error("Dashboard submissions error:", error.message);

    res.status(500).json({
      error: "Internal server error"
    });
  }
}

async function getStats(req, res) {
  try {
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM submissions
       WHERE user_id = $1`,
      [req.user.userId]
    );

    const widgetResult = await pool.query(
      `SELECT widget_id, COUNT(*) AS submissions
       FROM submissions
       WHERE user_id = $1
       GROUP BY widget_id
       ORDER BY submissions DESC`,
      [req.user.userId]
    );

    const geoResult = await pool.query(
      `SELECT country, city, COUNT(*) AS submissions
       FROM submissions
       WHERE user_id = $1
       GROUP BY country, city
       ORDER BY submissions DESC`,
      [req.user.userId]
    );

    res.json({
      total_submissions: Number(totalResult.rows[0].total),
      per_widget: widgetResult.rows,
      geo_breakdown: geoResult.rows
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);

    res.status(500).json({
      error: "Internal server error"
    });
  }
}

module.exports = {
  getSubmissions,
  getStats
};