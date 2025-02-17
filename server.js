const pg = require("pg");
const express = require("express");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const client = new pg.Client();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees ORDER BY created_at DESC;`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments;`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *;`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send({ message: "created successfully", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.params);
    const SQL = `UPDATE employees SET name=$1, department_id=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    console.log(rows);
    res.send({ message: "updated successfully", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1 RETURNING *;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

const init = async () => {
  try {
    await client.connect();

    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments (id SERIAL PRIMARY KEY, name VARCHAR(127) NOT NULL);
    CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(127) NOT NULL, created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), department_id INT REFERENCES departments(id) NOT NULL);
    `;
    console.log("CREATING TABLES...");
    await client.query(SQL);
    console.log("TABLES CREATED!");

    SQL = `INSERT INTO departments(name) VALUES ('Accounting'), ('Marketing'), ('Sales');`;
    await client.query(SQL);
    console.log("Departments inserted!");

    SQL = `INSERT INTO employees(name, department_id) 
    VALUES 
      ('John Paul', (SELECT id FROM departments WHERE name='Accounting')),
      ('Owen Smith', (SELECT id FROM departments WHERE name='Marketing')),
      ('Bob Miller', (SELECT id FROM departments WHERE name='Sales'));`;
    console.log("Seeding data...");
    await client.query(SQL);
    console.log("Seeded!");

    app.listen(PORT, () => {
      console.log(`server alive on PORT ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};

init();
