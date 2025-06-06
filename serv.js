const express = require('express');
const app = express();

const request = require("request");

var passwordHash = require('password-hash');
const bodyParser = require("body-parser");

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended : false}));

app.use(express.static("public"));

app.set("view engine","ejs");

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore , Filter} = require('firebase-admin/firestore');

var serviceAccount = require("./Key.json");

initializeApp({
  credential: cert(serviceAccount),
});
 
const db = getFirestore();

app.get("/", function (req,res){
    console.log("hello");
  res.sendFile(__dirname + "/public/" + "home.html");
});

app.post("/signupSubmit", function(req,res){
console.log(req.body);
  db.collection("usersDemo")
    .where(
        Filter.or(
          Filter.where("email" , "==" ,req.body.email),
          Filter.where("userName" , "==" ,req.body.username)
        )
    )
    .get()
    .then((docs) => {
    if (docs.size > 0){
      res.send("Sorry,This account is already Exists with email and username");
    } else {
        const valid_email = true;
        const options = {
            method: 'GET',
            url: 'https://mailcheck.p.rapidapi.com/',
            qs: {
              domain: req.body.email
            },
            headers: {
              'X-RapidAPI-Key': '43ca8e9680msh0b00609e3196b44p1c4114jsn89d648aefd7e',
              'X-RapidAPI-Host': 'mailcheck.p.rapidapi.com'
            }
          };
          
          request(options, function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
        });
        if(valid_email){
            db.collection("usersDemo")
                .add({
                userName : req.body.username,
                email : req.body.email,
                password : passwordHash.generate(req.body.password),
            })
            .then(() => {
                res.sendFile(__dirname + "/public/" + "login.html");
            })
            .catch(() => {
                res.send("Something went wrong");
            });
        }
        else{
            res.send("Email is not valid,please check your mail and try again\nYour email domain should end with @gmail.com")
        }
    }
  });
});

app.post("/loginSubmit", function(req,res){
  db.collection("usersDemo")
    .where("userName", "==" , req.body.username)
    .get()
    .then((docs) => {
      let verified = false;
      docs.forEach((doc) => {
        verified = passwordHash.verify(req.body.password, doc.data().password);
      });

      if(verified){
        res.render("dashboard");
      } else{
        res.send("Fail");
      }
  });
});
app.get("/moviedetails", function (req, res) {
  if (req.query.title && req.query.title.length > 0) {
    const apiKey = '8a74c5dd'; 
    const apiUrl = `http://www.omdbapi.com/?t=${req.query.title}&apikey=${apiKey}`;

    request(apiUrl, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const data = {
          Title: JSON.parse(body).Title,
          Date_of_Release: JSON.parse(body).Released,
          Actors: JSON.parse(body).Actors,
          Rating: JSON.parse(body).imdbRating,
        };
        res.render("dashboard", { result: data });
      } else {
        res.render("dashboard", { result: null });
      }
    });
  } else {
    res.render("dashboard", { result: null });
  }
});

app.listen(3000, () => {
  console.log("Running on port 3000");
});

