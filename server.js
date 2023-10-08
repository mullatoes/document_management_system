const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");

app.use(express.json());
app.use(cors());

const corsOptions = {
  origin: "http://localhost:3000", // Replace with your frontend URL
};

app.use(cors(corsOptions));

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Admin@123",
  database: "doc_sub",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Create a route to handle user login
app.get("/users/login", async (req, res) => {
  const { name, password } = req.query;

  // Query the database to find the user by name
  const query = "SELECT * FROM users WHERE name = ?";
  db.query(query, [name], async (err, results) => {
    if (err) {
      console.error("Database query failed:", err.message);
      return res.status(500).send("Database query error");
    }

    if (results.length === 0) {
      return res.status(400).send("User not found");
    }

    const user = results[0];

    try {
      if (await bcrypt.compare(password, user.password)) {
        res.send("Login successful");
      } else {
        res.send("Incorrect password");
      }
    } catch (error) {
      console.error("Password comparison error:", error);
      res.status(500).send("Internal server error");
    }
  });
});

app.get("/users", (req, res) => {
  // Fetch user records from the database
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).send("Error fetching users");
      return;
    }

    // Send the user records as JSON response
    res.json(results);
  });
});

app.post("/users", async (req, res) => {
  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    console.log(salt);
    console.log(hashedPassword);

    const user = {
      name: req.body.name,
      password: hashedPassword,
    };

    //users.push(user);
    // Insert user into the MySQL database
    db.query(
      "INSERT INTO users (name, password) VALUES (?, ?)",
      [user.name, user.password],
      (err, result) => {
        if (err) {
          console.error("Error inserting user: " + err.message);
          res.status(500).send("Error inserting user");
        } else {
          console.log("User inserted into the database");
          res.status(201).send("User registered successfully");
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.post("/users/login", async (req, res) => {
  const user = users.find((user) => (user.name = req.body.name));

  if (user == null) {
    return res.status(400).send("Cannot find user");
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("Success");
    } else {
      res.send("Not allowed");
    }
  } catch {
    res.status(500).send();
  }
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});
