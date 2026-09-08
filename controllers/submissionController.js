const pool = require("../db/database");

const {
  getGeoLocation
} = require("../services/geoService");

const {
  sendSubmissionSideEffect
} = require("../services/sideEffectService");


async function createSubmission(req, res) {
  try {
    const {
      widget_id,
      form_data,
      website
    } = req.body || {};

    const idempotencyKey =
      req.get("Idempotency-Key")?.trim() || null;


    /*
    |--------------------------------------------------------------------------
    | Honeypot Spam Protection
    |--------------------------------------------------------------------------
    */
    if (
      website &&
      typeof website === "string" &&
      website.trim() !== ""
    ) {
      return res.status(400).json({
        error: "Invalid submission"
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Widget ID Validation
    |--------------------------------------------------------------------------
    */
    if (
      !widget_id ||
      typeof widget_id !== "string"
    ) {
      return res.status(400).json({
        error: "Widget ID is required"
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Form Data Validation
    |--------------------------------------------------------------------------
    */
    if (
      !form_data ||
      typeof form_data !== "object" ||
      Array.isArray(form_data)
    ) {
      return res.status(400).json({
        error: "Form data is required"
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Find Widget
    |--------------------------------------------------------------------------
    */
    const widgetResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        fields
      FROM widgets
      WHERE id = $1
      `,
      [widget_id]
    );


    if (widgetResult.rows.length === 0) {
      return res.status(404).json({
        error: "Widget not found"
      });
    }


    const widget = widgetResult.rows[0];

    const widgetFields =
      Array.isArray(widget.fields)
        ? widget.fields
        : [];


    /*
    |--------------------------------------------------------------------------
    | Allowed Field Names
    |--------------------------------------------------------------------------
    */
    const allowedFieldNames = new Set(
      widgetFields
        .filter(
          (field) =>
            field &&
            typeof field.name === "string"
        )
        .map(
          (field) => field.name
        )
    );


    /*
    |--------------------------------------------------------------------------
    | Reject Unknown Fields
    |--------------------------------------------------------------------------
    */
    for (
      const [name, value]
      of Object.entries(form_data)
    ) {
      if (
        !allowedFieldNames.has(name)
      ) {
        return res.status(400).json({
          error: `Unknown form field: ${name}`
        });
      }


      /*
      | Only simple JSON values are accepted.
      */
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        return res.status(400).json({
          error: `Invalid value for field: ${name}`
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Required Fields + Email Validation
    |--------------------------------------------------------------------------
    */
    for (
      const field of widgetFields
    ) {
      if (
        field?.required
      ) {
        const value =
          form_data[field.name];

        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ""
        ) {
          return res.status(400).json({
            error:
              `Field is required: ${field.name}`
          });
        }
      }


      if (
        field?.type === "email" &&
        form_data[field.name] !== undefined
      ) {
        const email =
          String(
            form_data[field.name]
          ).trim();

        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailPattern.test(email)
        ) {
          return res.status(400).json({
            error:
              `Invalid email for field: ${field.name}`
          });
        }
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Idempotency Check
    |--------------------------------------------------------------------------
    */
    if (idempotencyKey) {
      const existing =
        await pool.query(
          `
          SELECT
            id,
            widget_id,
            form_data,
            ip_address,
            country,
            city,
            created_at
          FROM submissions
          WHERE widget_id = $1
            AND idempotency_key = $2
          `,
          [
            widget.id,
            idempotencyKey
          ]
        );


      if (
        existing.rows.length > 0
      ) {
        return res.status(200).json({
          message:
            "Submission already received",
          submission:
            existing.rows[0]
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | IP Address
    |--------------------------------------------------------------------------
    */
    const ip =
      req.ip || null;


    /*
    |--------------------------------------------------------------------------
    | Geo Enrichment
    |--------------------------------------------------------------------------
    | Provider A -> Provider B -> no geo
    |--------------------------------------------------------------------------
    */
    let geo = null;

    try {
      geo =
        await getGeoLocation(ip);
    } catch (error) {
      console.error(
        "Geo enrichment failed:",
        error.message
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Store Submission
    |--------------------------------------------------------------------------
    */
    let result;

    try {
      result =
        await pool.query(
          `
          INSERT INTO submissions
          (
            widget_id,
            user_id,
            form_data,
            ip_address,
            country,
            city,
            idempotency_key
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
          RETURNING
            id,
            widget_id,
            form_data,
            ip_address,
            country,
            city,
            created_at
          `,
          [
            widget.id,
            widget.user_id,
            JSON.stringify(form_data),
            ip,
            geo
              ? geo.country
              : null,
            geo
              ? geo.city
              : null,
            idempotencyKey
          ]
        );

    } catch (error) {

      /*
      |--------------------------------------------------------------------------
      | Race-condition protection for idempotency
      |--------------------------------------------------------------------------
      */
      if (
        error.code === "23505" &&
        idempotencyKey
      ) {
        const existing =
          await pool.query(
            `
            SELECT
              id,
              widget_id,
              form_data,
              ip_address,
              country,
              city,
              created_at
            FROM submissions
            WHERE widget_id = $1
              AND idempotency_key = $2
            `,
            [
              widget.id,
              idempotencyKey
            ]
          );


        if (
          existing.rows.length > 0
        ) {
          return res.status(200).json({
            message:
              "Submission already received",
            submission:
              existing.rows[0]
          });
        }
      }

      throw error;
    }


    const submission =
      result.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Background Side Effect
    |--------------------------------------------------------------------------
    | It runs AFTER the database insert.
    | Failure never changes the successful submission response.
    |--------------------------------------------------------------------------
    */
    setImmediate(() => {
      sendSubmissionSideEffect(
        submission
      )
        .then(() => {
          console.log(
            "✅ Side effect completed"
          );
        })
        .catch((error) => {
          console.error(
            "⚠️ Side effect failed:",
            error.message
          );
        });
    });


    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */
    return res.status(201).json({
      message:
        "Submission received successfully",
      submission
    });

  } catch (error) {

    console.error(
      "Create submission error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Internal server error"
    });
  }
}


module.exports = {
  createSubmission
};