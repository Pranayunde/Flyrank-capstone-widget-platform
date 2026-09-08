const pool = require("../db/database");


/*
|--------------------------------------------------------------------------
| CREATE WIDGET
|--------------------------------------------------------------------------
*/
async function createWidget(req, res) {
  try {
    const {
      type,
      title,
      description,
      fields,
      button_text,
      display_options
    } = req.body || {};


    if (
      !title ||
      typeof title !== "string" ||
      title.trim() === ""
    ) {
      return res.status(400).json({
        error:
          "Widget title is required"
      });
    }


    if (
      fields !== undefined &&
      !Array.isArray(fields)
    ) {
      return res.status(400).json({
        error:
          "Widget fields must be an array"
      });
    }


    const result =
      await pool.query(
        `
        INSERT INTO widgets
        (
          user_id,
          type,
          title,
          description,
          fields,
          button_text,
          display_options
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING *
        `,
        [
          req.user.userId,
          type || "lead_capture",
          title.trim(),
          description || null,
          JSON.stringify(
            fields || []
          ),
          button_text || "Submit",
          JSON.stringify(
            display_options || {}
          )
        ]
      );


    return res.status(201).json({
      message:
        "Widget created successfully",
      widget:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "Create widget error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


/*
|--------------------------------------------------------------------------
| GET ALL USER WIDGETS
|--------------------------------------------------------------------------
*/
async function getWidgets(req, res) {
  try {

    const result =
      await pool.query(
        `
        SELECT *
        FROM widgets
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.userId]
      );


    return res.status(200).json({
      widgets:
        result.rows
    });

  } catch (error) {

    console.error(
      "Get widgets error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


/*
|--------------------------------------------------------------------------
| GET ONE WIDGET
|--------------------------------------------------------------------------
| Tenant isolation:
| user_id MUST match authenticated user.
|--------------------------------------------------------------------------
*/
async function getWidgetById(req, res) {
  try {

    const {
      id
    } = req.params;


    const result =
      await pool.query(
        `
        SELECT *
        FROM widgets
        WHERE id = $1
          AND user_id = $2
        `,
        [
          id,
          req.user.userId
        ]
      );


    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Widget not found"
      });
    }


    return res.status(200).json({
      widget:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "Get widget error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


/*
|--------------------------------------------------------------------------
| UPDATE WIDGET
|--------------------------------------------------------------------------
*/
async function updateWidget(req, res) {
  try {

    const {
      id
    } = req.params;


    const {
      type,
      title,
      description,
      fields,
      button_text,
      display_options
    } = req.body || {};


    if (
      !title ||
      typeof title !== "string" ||
      title.trim() === ""
    ) {
      return res.status(400).json({
        error:
          "Widget title is required"
      });
    }


    if (
      fields !== undefined &&
      !Array.isArray(fields)
    ) {
      return res.status(400).json({
        error:
          "Widget fields must be an array"
      });
    }


    const result =
      await pool.query(
        `
        UPDATE widgets
        SET
          type = $1,
          title = $2,
          description = $3,
          fields = $4,
          button_text = $5,
          display_options = $6,
          updated_at = NOW()
        WHERE id = $7
          AND user_id = $8
        RETURNING *
        `,
        [
          type || "lead_capture",
          title.trim(),
          description || null,
          JSON.stringify(
            fields || []
          ),
          button_text || "Submit",
          JSON.stringify(
            display_options || {}
          ),
          id,
          req.user.userId
        ]
      );


    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Widget not found"
      });
    }


    return res.status(200).json({
      message:
        "Widget updated successfully",
      widget:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "Update widget error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


/*
|--------------------------------------------------------------------------
| DELETE WIDGET
|--------------------------------------------------------------------------
*/
async function deleteWidget(req, res) {
  try {

    const {
      id
    } = req.params;


    const result =
      await pool.query(
        `
        DELETE FROM widgets
        WHERE id = $1
          AND user_id = $2
        RETURNING id
        `,
        [
          id,
          req.user.userId
        ]
      );


    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Widget not found"
      });
    }


    return res.status(200).json({
      message:
        "Widget deleted successfully",
      widgetId:
        result.rows[0].id
    });

  } catch (error) {

    console.error(
      "Delete widget error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


/*
|--------------------------------------------------------------------------
| PUBLIC WIDGET CONFIG
|--------------------------------------------------------------------------
| No authentication because customer websites need this endpoint.
|
| Cache-Control:
| 60 seconds = short-lived config cache.
|--------------------------------------------------------------------------
*/
async function getPublicWidgetConfig(req, res) {
  try {

    const {
      id
    } = req.params;


    const result =
      await pool.query(
        `
        SELECT
          id,
          type,
          title,
          description,
          fields,
          button_text,
          display_options
        FROM widgets
        WHERE id = $1
        `,
        [id]
      );


    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Widget not found"
      });
    }


    res.setHeader(
      "Cache-Control",
      "public, max-age=60"
    );


    return res.status(200).json({
      widget:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "Public widget config error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


module.exports = {
  createWidget,
  getWidgets,
  getWidgetById,
  updateWidget,
  deleteWidget,
  getPublicWidgetConfig
};