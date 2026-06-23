require("dotenv").config();

const express = require("express");
const cors = require("cors");

// connect PostgreSQL
require("./db");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("API is running");
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});