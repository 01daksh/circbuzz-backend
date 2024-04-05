const express = require("express");
const router = express.Router();
const { Client } = require('pg');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const creds = {
    host: "localhost",
    user: "postgres",
    port: "5432",
    password: process.env.PASSWORD,
    database: "postgres"
};

router.post("/signup",async (req, res)=>{
    try {
        const client = new Client(creds);
        const {username, email, password, id} = req.body;
        
        const hashedPswd = await bcrypt.hash(password, 10);

        const signUpquery = `INSERT INTO users(username, email, password, id) VALUES ($1, $2, $3, $4) RETURNING *`;

        await client.connect();
        const result = await client.query(signUpquery, [username, email, hashedPswd, id]);

        if(!result.rows){
            await client.end();
            return res.status(500).send("DB is down! Retry or you are entering wrong input");
        }

        await client.end();
        return res.status(200).json({
            status : "Admin account successfully created",
            status_code : 200,
            user_id : id
        })

    } catch (err) {
        return res.status(500).send("DB is down, retry again");
    }
});

router.post("/login", async (req, res) => {
    try {
        const client = new Client(creds);
        const { username, password } = req.body;

        const loginQuery = `SELECT * FROM users WHERE username = $1`;
        await client.connect();

        const result = await client.query(loginQuery, [username]);
        if (!result.rows) {
            await client.end();
            return res.status(401).json({
                "status_code": 401,
                "status": "Incorrect username/password provided. Please retry",
            })
        }
        //extracting the data from the results
        const user = result.rows[0];

        await client.end();
        //authentication for password is done here!
        if (bcrypt.compare(password, user.password)) {
            //jwt usage
            const webToken = jwt.sign({ user }, process.env.SECRET_KEY);
            
            return res.status(200).json({
                status: "Login Successful",
                status_code: 200,
                user_id: user.id,
                access_token: webToken,
            })
        }
        else {
            return res.status(401).json({
                "status_code": 401,
                "status": "Incorrect username/password provided. Please retry",
            })
        }
        // await client.end();

    } catch (err) {
        res.status(500).json({
            message: "error occured in DB",
        })
    }

})
module.exports = router;