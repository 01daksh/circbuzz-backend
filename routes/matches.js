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

router.post("/", verifyToken, async(req, res) => {
    try {
        const {match_id, team1, team2, date, venue} = req.body;
        const client = new Client(creds);
        const insertMatchQuery = `INSERT INTO matches(match_id, team_1, team_2, venue, date) VALUES($1, $2, $3, $4, $5) RETURNING *`;

        await client.connect();
        const result = await client.query(insertMatchQuery, [match_id, team1, team2, venue, date]);
        if(!result.rows){
            await client.end();
            return res.status(500).send("DB down for match insertion");
        }

        await client.end();
        return res.status(200).json({
            message : "Match created successfully",
            match_id : match_id,
        })

        return res.status(200).send("hi");

    } catch (err) {
        return res.status(500).send("DB Error")
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

router.get("/", async (req, res) => {

    try {
        const client = new Client(creds);
        await client.connect();

        const getMatchesQuery = `SELECT * FROM matches`;
        const result = await client.query(getMatchesQuery);

        await client.end();

        return res.json({
            matches: result.rows
        })
    } catch (err) {
        return res.status(500).send("DB Error");
    }

});

router.get("/:id", async (req, res) => {
    try {
        const matchId = req.params.id;
        const getMatchIdQuery = `SELECT * FROM matches WHERE match_id = $1`;
        const client = new Client(creds);
        await client.connect();
        const result = await client.query(getMatchIdQuery, [matchId]);

        if(!result.rows){
            await client.end();
            return res.status(404).send("Not found matches for the id");
        }

        const nowDate = new Date();
        const currDate = new Date(result.rows[0].date);
        const diffDate = nowDate-currDate;
        let eventDate = 'Upcomping';
        if(diffDate > 0){
            eventDate = 'Gone';
        }
        
        const extractTeam = `SELECT player_name, role FROM teams WHERE team_id = $1`;

        //hard coded these values for now
        const firstTeam = await client.query(extractTeam, ['1']);
        const secondTeam = await client.query(extractTeam, ['2']);
        if(!firstTeam.rows || !secondTeam.rows){
            await client.end();
            return res.status(404).json({
                message : "Either of the specified teams not found",
            })
        }

        await client.end();
        return res.status(200).json({
            matchid : result.rows[0].match_id,
            team_1 : result.rows[0].team_1,
            team_2 : result.rows[0].team_2,
            date : result.rows[0].date,
            venue : result.rows[0].venue,
            status : eventDate,
            squads : [
                {team1 : firstTeam.rows},
                {team2 : secondTeam.rows},
            ],
        })

    } catch (err) {
        return res.status(500).send("DB Error");
    }
})
module.exports = router