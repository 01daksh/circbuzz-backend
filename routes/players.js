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
//DB


router.get("/:player_id/stats",verifyToken, async (req, res) => {

    try {
        const client = new Client(creds);
        const player_id = req.params.player_id;
        await client.connect();

        const getPlayerStats = `SELECT * FROM players WHERE player_id = $1`;
        const result = await client.query(getPlayerStats,[player_id]);

        if(!result.rows){
            await client.end();
            return res.status(404).send("No player found for the id");
        }
        await client.end();

        return res.status(200).json({
            response_data : result.rows[0],
        })
    } catch (err) {
        return res.status(500).send("DB Error");
    }

});

//middleware for jwt auth
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            status: 'fail',
            message: 'Unauthorized!',
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const user = jwt.verify(token, process.env.SECRET_KEY);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'fail',
            message: 'Unauthorized!',
        });
    }
}



module.exports = router