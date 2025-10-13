import pg from "pg";

const pool = new pg.Pool({
  user: "jcarlosgm",
  host: "dpg-d3luq6s9c44c73ep3kag-a.oregon-postgres.render.com",
  password: "rm9PiAjDlGqWEuDJiUk7rcxf3OL586Eb",
  database: "resslydb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('✅ Pool de PostgreSQL configurado con SSL');

export { pool };