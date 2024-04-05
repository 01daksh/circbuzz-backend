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


router.post("/:team_id/squad",verifyToken, async (req, res) => {

    try {
        const client = new Client(creds);
        const team_id = req.params.team_id;

        const {name, role} = req.body;

        await client.connect();

        const getLastPlayer = `SELECT player_id FROM players ORDER BY player_id DESC LIMIT 1`;
        const lastId = await client.query(getLastPlayer);

        if(!lastId.rows){
            await client.end();
            return res.status(404).send("No player found for the id");
        }

        // console.log(lastId.rows[0]["player_id"]);
        // let current_player_id = generateNumber(lastId.rows[0]["player_id"], 4);
        let current_player_id = lastId.rows[0]["player_id"];
        console.log(current_player_id);
        current_player_id = 1+Number(current_player_id) ;

        const insertTeamplayerQuery = `INSERT INTO teams(player_name, role, player_id, team_id) VALUES ($1, $2, $3, $4) RETURNING *`;
        const result = await client.query(insertTeamplayerQuery, [name, role, current_player_id, team_id]);

        if(!result.rows){
            await client.end();
            return res.status(500).json({
                message : "DB is down for teams player insertion",
            })
        }


        await client.end();
        return res.status(200).json({
            message : "Player added to squad successfully",
            player_id : current_player_id,
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

// function generateNumber(number, length){
//     let str = "" + number;
//     while(str.length < length){
//         str = "0" + str;
//     }
//     return str;
// }

module.exports = router