const express = require("express");
const cors = require("cors");
const mongooseConfig = require("./database/mongooseConfig");
const users = require("./database/users-schema");
const contacts =require("./database/contacts-schema");
const { hashPassword, confirmPassword } = require("./bcrypt")
const jwt = require("jsonwebtoken");
let jwtkey = "e-commerce";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/register", async (req, res) => {
  let { name, email, password } = req.body;
  password = hashPassword(password);
  let data = new users({ name, password, email });
  let result = await data.save();
  result = result.toObject();
  delete result.password;
  jwt.sign({ result }, jwtkey, { expiresIn: "365d" }, (err, token) => {
    if (err) {
      res.send("some problem in jwt");
    }
    res.send({ result, authentication: token });
  });
});

app.post("/api/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    let email = req.body.email;
    let result = await users.findOne({ email });
    if (result) {
      let passwordAuth = confirmPassword(req.body.password, result.password);
      if (passwordAuth) {
        jwt.sign({ result }, jwtkey, { expiresIn: "365d" }, (err, token) => {
          if (err) {
            res.send("something problem in jwt");
          }
          res.send({ result, authentication: token });
        });
      } else {
        res.send({ message: "invalid credientials !! Try again" });
      }
    } else {
      res.send({
        message: "No user with this email account! Please register first",
      });
    }
  } else {
    res.send({ message: "Fill all required fields" });
  }
});


app.post("/api/addContact", middleware, async (req, res) => {
  let data = new contacts(req.body);
  let result = await data.save();
  res.send(result);
});

app.get("/api/contactList/:id", middleware, async (req, res) => {
  let data = await contacts.find({userId: req.params.id });
  if (data.length) {
    res.send(data);
  } else {
    res.send({ result: "no product in database" });
  }
});

app.delete("/api/contactList/delete/:id", middleware, async (req, res) => {
  let data = await contacts.deleteOne({ _id: req.params.id });
  res.send(data);
});

app.get("/api/updateContact/:id", middleware, async (req, res) => {
  let data = await contacts.findOne({ _id: req.params.id });
  if (data) {
    res.send(data);
  } else {
    res.send({ result: "no result found" });
  }
});

app.put("/api/updateContact/:id", async (req, res) => {
  let data = await contacts.updateOne(
    { _id: req.params.id },
    { $set: req.body, bike: "honda" }
  );
  res.send(data);
});

app.get("/api/search/:key", middleware, async (req, res) => {
  let data = await contacts.find({
    $or: [
      { name: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(data);
});

function middleware(req, res, next) {
  let token = req.headers["authentication"];
  if (token) {
    jwt.verify(token, jwtkey, (err, valid) => {
      if (err) {
        res.status(401).send("Enter valid token");
      } else {
        next();
      }
    });
  } else {
    res.status(403).send("Provide token in header");
  }
}

app.listen(8000, (err) => {
  if (err) console.log(err);
  else {
    console.log("server running on port 8000");
  }
});
