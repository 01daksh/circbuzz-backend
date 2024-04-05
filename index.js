require('dotenv').config();

const express = require("express");
const app = express();
const router = express.Router();

//middlewares
app.use(express.json());

//for routing the apis
app.use('/api/admin/', require('./routes/admin'))
app.use('/api/matches/', require('./routes/matches'));
app.use('/api/players/', require('./routes/players'));
app.use('/api/teams/', require('./routes/teams'));
//port listen
app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});

module.exports = app;