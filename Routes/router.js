const express = require("express");

const router = new express.Router();

const conn = require("../db/conn");
const secretKey = process.env.SECRET_KEY;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotEnv = require("dotenv");

// // Add task API
// router.post("/createtask", (req, res) => {
//     const { task, status } = req.body;
//     console.log(task)
//     console.log(status)

//     try {
        
//         const query = "INSERT INTO addtask (newtask, status) VALUES (?, ?)";
//         conn.query(query, [task, status], (err, result) => {
//             if (err) {
//                 console.error(`Error adding new task: ${err}`);
//                 return res.status(500).json({ error: "Failed to add task" });
//             }
//             res.status(200).json("Task added successfully");
//         });
//     } catch (e) {
//         console.error(`Caught error at adding task to DB: ${e}`);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

router.post("/userregister", (req, res) => {
    const { id, username, email, password } = req.body;
    // console.log(id)
    // console.log(username);
    // console.log(email);
    // console.log(password);

    try {
        const query = "SELECT username FROM users WHERE email = ?";
        conn.query(query, [email], async(err, result) => {
            if (result.length > 0) {
                return res.status(400).send("User already exists");
            }
            if (err) {
                console.error(`Error checking if user exists: ${err}`);
                return res.status(500).json({ error: "Internal server error" });
            }
            
            
            const hashedpassword = await bcrypt.hash(password,10);
            const insertQuery = "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)";
            conn.query(insertQuery, [id, username, email, hashedpassword], (err) => {
                if (err) {
                    console.error(`Error adding new user: ${err}`);
                    return res.status(500).json({ error: "Failed to register user" });
                }

                return res.status(200).json("User added successfully");
            });
        });
    } catch (e) {
        console.error(`Caught error at registering user to DB: ${e}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/userlogin", (req, res) => {
    const { email, password } = req.body;
    
    // console.log(email);
    // console.log(password);


    try {
        const query = "SELECT * FROM users WHERE email = ?";
        conn.query(query, [email], async (err, result) => {
            if (err) {
                console.error("Error querying user: ", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            if (result.length > 0) {
                const user = result[0]; 

                
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: "Invalid details: Backend" });
                }

                // Generate a token using user id (adjust if using a different field)
                const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: "1h" });
                // console.log("User login successful: Backend");
                return res.status(200).json({ success: "User login successful: Backend", token });
            } else {
                return res.status(400).json("User does not exist");
            }
        });
    } catch (error) {
        console.error("Caught error at logging user to DB: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    // console.log("token is "+token);
    if (!token) return res.sendStatus(401);
    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
    //   console.log(req.user);
      next();
    });
  };

router.get('/profile', authenticateToken, (req, res) => {
    conn.query('SELECT username, email FROM users WHERE id = ?', [req.user.userId], (err, results) => {
      if (err) return res.status(500).send(err);
    //   console.log(results);
      res.json(results[0]);
    });
  });


router.post("/addthetask",authenticateToken,(req,res)=>{
    const {task,status} = req.body;
    try{

        conn.query('insert into alltasks (id,newtask,status) values (?,?,?)',[req.user.userId,task,status],(err)=>{
           if(err){
            return res.send("error in adding")
           }
           return res.send("Task added succesfully")
        })
    }catch(e){
        res.status(500).json({ error: "Internal server error" });
    }
})


router.get("/gettasks",authenticateToken,(req,res)=>{
    try{
        conn.query("select newtask,status from alltasks where id like ?",[req.user.userId],(err,result)=>{
            if (err){
                return res.send("error in getting alltasks")
            }
            return res.status(200).json(result);
        })
    }catch(e){
        res.status(500).json({ error: "Internal server error" });
    }
})

router.delete("/deletetasks",authenticateToken,(req,res)=>{
    const {task} = req.body
    try{
        conn.query("delete from alltasks where newtask like ?",[task],(err)=>{
            if (err){
                return res.send("error in getting alltasks")
            }
            return res.status(200).json("succesfully deleted");
        })
    }catch(e){
        res.status(500).json({ error: "Internal server error" });
    }
})


  
  router.put('/changedata', authenticateToken, (req, res) => {
    const { username, email } = req.body; 
  
    
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }
  
    
    const query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    conn.query(query, [username, email, req.user.userId], (err, results) => {
      if (err) {
        console.error("Error updating user data:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
  
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ message: "User data updated successfully" });
    });
  });
  
module.exports = router;
