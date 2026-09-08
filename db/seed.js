require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function seed() {
  try {
    const email = "demo@flyrank.local";
    const password = "DemoPass123!";

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (email)
      DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, email
      `,
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const widgetId = "11111111-1111-4111-8111-111111111111";

    await pool.query(
      `
      INSERT INTO widgets (id, user_id, name, config)
      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        config = EXCLUDED.config
      `,
      [
        widgetId,
        user.id,
        "Demo Lead Widget",
        JSON.stringify({
          fields: [
            {
              name: "name",
              label: "Name",
              type: "text",
              required: true
            },
            {
              name: "email",
              label: "Email",
              type: "email",
              required: true
            },
            {
              name: "message",
              label: "Message",
              type: "textarea",
              required: false
            }
          ]
        })
      ]
    );

    console.log("Demo user created/updated:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Demo widget ID:", widgetId);
    console.log("Database seed completed successfully.");
  } catch (error) {
    console.error("Database seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();