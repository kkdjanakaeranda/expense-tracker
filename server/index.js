require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// Test API
app.get("/", (req,res)=>{
    res.send("API is running");
});


// Register API
app.post("/register", async(req,res)=>{

    try {

        const {name,email,password} = req.body;

        const hashedPassword = await bcrypt.hash(password,10);

        const result = await pool.query(
            "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
            [name,email,hashedPassword]
        );

        res.json({
            message:"User Registered",
            user:result.rows[0]
        });

    } catch(error){

        console.log(error.message);

        res.status(500).json({
            error:error.message
        });

    }

});


// 👇 ADD LOGIN API HERE
app.post("/login", async(req,res)=>{

    try{

        const {email,password} = req.body;


        const user = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );


        if(user.rows.length === 0){

            return res.status(400).json({
                message:"User not found"
            });

        }


        const foundUser = user.rows[0];


        const validPassword = await bcrypt.compare(
            password,
            foundUser.password
        );


        if(!validPassword){

            return res.status(400).json({
                message:"Wrong password"
            });

        }


        const token = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"1h"
            }
        );


        res.json({

            message:"Login successful",

            token:token,

            user:{
                id:foundUser.id,
                name:foundUser.name,
                email:foundUser.email
            }

        });


    }
    catch(error){

        console.log(error.message);

        res.status(500).json({
            error:error.message
        });

    }

});

app.post("/expense", async (req, res) => {
  try {
    const { user_id, amount, category, description } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions
       (user_id, type, amount, category, description)
       VALUES ($1, 'expense', $2, $3, $4)
       RETURNING *`,
      [user_id, amount, category, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/test", (req, res) => {
  res.send("Test route works");
});

app.get("/expenses/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const expenses = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );

    res.json(expenses.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/expense/:id", async(req,res)=>{

    try{

        const {id}=req.params;

        await pool.query(
            "DELETE FROM transactions WHERE id=$1",
            [id]
        );

        res.json({
            message:"Expense deleted"
        });

    }catch(error){

        res.status(500).json({
            error:error.message
        });

    }

});

app.put("/expense/:id", async(req,res)=>{

    try{

        const {id} = req.params;

        const {
            amount,
            category,
            description
        } = req.body;


        const result = await pool.query(

            `UPDATE transactions
             SET amount=$1,
                 category=$2,
                 description=$3
             WHERE id=$4
             RETURNING *`,

            [
                amount,
                category,
                description,
                id
            ]

        );


        res.json(result.rows[0]);


    }catch(error){

        console.log(error.message);

        res.status(500).json({
            error:error.message
        });

    }

});

app.post("/income", async(req,res)=>{

    try{

        const {
            user_id,
            amount,
            category,
            description
        } = req.body;


        const result = await pool.query(

            `INSERT INTO transactions
            (user_id,type,amount,category,description)
            VALUES($1,'income',$2,$3,$4)
            RETURNING *`,

            [
                user_id,
                amount,
                category,
                description
            ]

        );


        res.json(result.rows[0]);


    }catch(error){

        console.log(error.message);

        res.status(500).json({
            error:error.message
        });

    }

});

// Server start
app.listen(5000,()=>{
    console.log("Server running on port 5000");
});