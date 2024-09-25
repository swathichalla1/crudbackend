require("dotenv").config();
const express = require("express")
const app = express();
const mysql = require("mysql2");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const DBcon = require("./db/conn")
const port = 4000;
const router = require("./Routes/router")
app.use(express.json());
app.use(cors());
app.use(router);

app.listen(port,()=>(
    console.log(`server started at port ${port}`)
))

app.get("/",(req,res)=>{
    res.send("Hi welcome universe divine");
})