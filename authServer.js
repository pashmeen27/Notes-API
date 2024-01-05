//File handling login and signup of users
require('dotenv').config()

const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt");
const PORT = 3000;
const pg = require("pg");

app.use(express.json());

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "NotesAPI",
    password:"a",
    port: 5432,
});

db.connect();

app.post("/api/auth/signup",async (req,res)=>{
    const {name, pass} = req.body;
    // console.log(name);
    try {
        const hashPass = await bcrypt.hash(pass,10);
        console.log(hashPass);
        //const user = {name : name, pass: hashPass};
        const result = db.query("SELECT * from users WHERE username = $1;",
                            [name]);
        
        if(result.rows !== null)
            return res.send("User already exists!");

        const result2 = db.query("INSERT INTO users (username, password) values ($1, $2) RETURNING *;",
                                [name, hashPass]);
        
        return res.json(result2.rows);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }   
});

app.post("/api/auth/login", async (req,res) => {

    const result = await db.query("SELECT password FROM users WHERE username = $1;",
                            [req.body.name]);

    let pass = result.rows[0].password;

    if (result.rows == null || result.rows.length == 0) {
        return res.send("Cannot find user!");
    }

    console.log(req.body.pass);
    console.log(pass);
    try {
        if(await bcrypt.compare(req.body.pass, pass)){
            const u = {name : req.body.name};
            const accessToken = generateAccessToken(u);

            res.json({accessToken : accessToken});
        } else {
            res.send("Incorrect credentials");
        }
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

function generateAccessToken (user) {
    return jwt.sign (user, process.env.ACCESS_TOKEN);
}
app.listen(PORT,()=> {
    console.log(`Listening to port ${PORT}`);
});
