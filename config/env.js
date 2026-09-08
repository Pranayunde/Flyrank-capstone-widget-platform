require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

module.exports = config;