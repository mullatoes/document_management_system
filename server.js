const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");

app.use(express.json());
app.use(cors());

const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Admin@123",
  database: "doc_sub",
});

// Create a storage engine for Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.get("/users/login", async (req, res) => {
  const { email, password } = req.query;

  console.log("Received login request for email:", email);
  console.log("Password: ", password);

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database query failed:", err.message);
      return res.status(500).send("Database query error");
    }

    if (results.length === 0) {
      console.log("User not found");
      return res.status(400).send("User not found");
    }

    const user = results[0];

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log(`Pass ${passwordMatch}`);
      if (passwordMatch) {
        console.log("Login successful");
        res.status(200).send("Login successful");
      } else {
        console.log("Incorrect password");
        res.status(401).send("Incorrect password");
      }
    } catch (error) {
      console.log("Password comparison error!");
      console.error("Password comparison error:", error);
      res.status(500).send("Internal server error");
    }
  });
});

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).send("Error fetching users");
      return;
    }

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
    console.log(`email ${req.body.email}`);

    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    };

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [user.name, user.email, user.password],
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

// API endpoint to handle file upload
app.post("/upload", upload.single("file"), (req, res) => {
  // Access the uploaded file via req.file
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // You can access the file data like this
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;

  // Store the file data in your MySQL database
  const sql = "INSERT INTO files (name, data) VALUES (?, ?)";
  db.query(sql, [fileName, fileBuffer], (err, result) => {
    if (err) {
      console.error("Error storing the file:", err);
      return res.status(500).json({ error: "File storage failed" });
    }
    return res.status(200).json({ message: "File stored successfully" });
  });
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});
