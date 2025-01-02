import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Initializing Server at port: 3000
const app = express();
const port = 3000;

// DB configuration
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "amiaman",
  port: 5432,
});

// DB connected
db.connect();

// MiddleWare
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

// let users = [
//   { id: 1, name: "Angela", color: "teal" },
//   { id: 2, name: "Jack", color: "powderblue" },
// ];

// Function Checking Current User's Visited Countries and return as an array
async function checkVisisted(user_id) {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = $1",[user_id]);
  let countries = [];
  console.log(result.rows);
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// Function to Fetch Users Data from the DB
async function fetchUsers(){
 const users = await db.query("SELECT * FROM users");
 console.log(users.rows);
 return users.rows;

}

// Function to Fetch the Color-code for the Current User
async function fetchColor(user_id){
  const color = await db.query("SELECT color FROM users WHERE id = $1", [user_id]);
  
  return color.rows[0];
 
 }

 // Handler Function For home Page
app.get("/", async (req, res) => {
  const users = await fetchUsers();
  const color = await fetchColor(currentUserId);
  const countries = await checkVisisted(currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color.color,
  });
});

// Handler to Add New Country to the visited List of the DB
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

// Handler to New User Route
app.post("/user", async (req, res) => {
  if(req.body.add){
    res.render("new.ejs");


  }
  else{
    currentUserId = req.body.user;
    res.redirect("/");


  }

});

// Handler for New User Entry into the DB
app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

// Server Listening to Port: 3000 
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
