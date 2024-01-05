require("dotenv").config();

const express = require("express");
const app = express();
const port = 8000;
const jwt = require("jsonwebtoken");
const pg = require("pg");
const cors = require("cors");

app.use(cors());
app.use(express.json());

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "NotesAPI",
    password:"a",
    port: 5432,
});

db.connect();

let notes = [];

//GET all notes for authenticated user
app.get("/api/notes", authenticateToken, async (req,res)=>{
    console.log(req.user.name);
    try{
         const result = await db.query("SELECT * FROM notes WHERE username = $1;",
                                        [req.user.name]);
         notes = result.rows;
         return res.json(notes);
     } catch (e) {
         console.error(e);
    }
});

//GET notes by id from authenticated user
app.get("/api/notes/:id", authenticateToken, async (req,res)=>{
    console.log(req.user.name);
    try{
         const result = await db.query("SELECT * FROM notes WHERE id = $1 AND username = $2;",
                                        [id, req.user.name]);
         notes = result.rows;
         return res.json(notes);
     } catch (e) {
         console.error(e);
    }
});

//POST notes by authenticated user
app.post("/api/notes", authenticateToken, async (req,res) => {

    console.log("POSTING");
    try {
        console.log(req.body.note);
        console.log(req.user.name);
        const result = await db.query("INSERT INTO notes (note, username) VALUES ($1, $2) RETURNING *;",
                                    [req.body.note, req.user.name]);
        return res.json(result.rows);

    } catch (e) {
        console.error(e);
    }
});

//PUT updated note by is for authenticated user
app.put ("/api/notes/:id", authenticateToken, async (req,res) => {

    console.log ("EDITING!!!");
    console.log(req.params)
    const {id} = req.params;
    console.log(id);
    const {note} = req.body;


    try {
        const result = db.query("UPDATE notes SET note = COALESCE($1, note) WHERE id=$2 AND username = $3 RETURNING *;",
                            [note, id, req.user.name]
                        );
        if (result.rows == null || result.rows.length == 0)
            return res.send("Invalid Id or User");
        
        return res.json(result.rows);
    } catch (e) {
        console.error(e);
    }
});

//DELETE note by id for authenticated user
app.delete("/api/notes/:id", authenticateToken, async (req,res)=> {

    const {id} = req.params;
    console.log(req.user.name);
    try {
        const result = await db.query("DELETE FROM notes WHERE id = $1 AND username = $2 RETURNING *;", 
                                    [id, req.user.name]);
        if (result.rows == null || result.rows.length == 0)
            return res.json("Invalid Id or User!");

        res.json(result.rows);
    } catch (e) {
        console.error(e);
    }
});

//SEARCH notes for authenticated user
app.get("/api/search", authenticateToken, (req,res) => {

    const filters = req.query;

});

function authenticateToken (req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    console.log("Authenitcation");

    if(token == null)
        return res.sendStatus(401);

    jwt.verify(token,process.env.ACCESS_TOKEN, (err,user) => {
        if (err)    return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.listen(port,() => {
    console.log(`Listening on port ${port}`);
});