require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Login required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Session expired. Please login again." });
  }
};

const normalizeTransaction = (row) => ({
  ...row,
  transaction_date: row.transaction_date || row.created_at || row.date
});

const ensureTransactionDateColumn = async () => {
  await pool.query(
    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE"
  );
};

app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email=$1", [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email",
      [name, email, hashedPassword]
    );

    res.json({
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const foundUser = user.rows[0];
    const validPassword = await bcrypt.compare(password, foundUser.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: foundUser.id,
        email: foundUser.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id,name,email FROM users WHERE id=$1", [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email=$1 AND id<>$2",
      [email, req.user.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const result = await pool.query(
      "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id,name,email",
      [name, email, req.user.id]
    );

    res.json({
      message: "Profile updated",
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await pool.query("SELECT password FROM users WHERE id=$1", [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashedPassword, req.user.id]);

    res.json({ message: "Password changed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const transactions = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );

    res.json(transactions.rows.map(normalizeTransaction));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/expenses/:userId", authenticateToken, async (req, res) => {
  try {
    const transactions = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );

    res.json(transactions.rows.map(normalizeTransaction));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/expense", authenticateToken, async (req, res) => {
  try {
    const { amount, category, description, transaction_date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ message: "Amount and category are required" });
    }

    const result = await pool.query(
      `INSERT INTO transactions
       (user_id, type, amount, category, description, transaction_date)
       VALUES ($1, 'expense', $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
       RETURNING *`,
      [req.user.id, amount, category, description || "", transaction_date || null]
    );

    res.json(normalizeTransaction(result.rows[0]));
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/income", authenticateToken, async (req, res) => {
  try {
    const { amount, category, description, transaction_date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ message: "Amount and category are required" });
    }

    const result = await pool.query(
      `INSERT INTO transactions
       (user_id,type,amount,category,description,transaction_date)
       VALUES($1,'income',$2,$3,$4,COALESCE($5::date, CURRENT_DATE))
       RETURNING *`,
      [req.user.id, amount, category, description || "", transaction_date || null]
    );

    res.json(normalizeTransaction(result.rows[0]));
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/expense/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, transaction_date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ message: "Amount and category are required" });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET amount=$1,
           category=$2,
           description=$3,
           transaction_date=COALESCE($4::date, transaction_date, CURRENT_DATE)
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [amount, category, description || "", transaction_date || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(normalizeTransaction(result.rows[0]));
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/expense/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/test", (req, res) => {
  res.send("Test route works");
});

ensureTransactionDateColumn()
  .catch((error) => {
    console.error("Could not prepare transaction date column:", error.message);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
