const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var dateFormat = require('dateformat');


app.set("port", 8080);
app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true }));


const Pool = require("pg").Pool;
const config = {
	host: "localhost",
	user: "new",
	password: "newpass",
	database: "server2"
};


const pool = new Pool(config);


app.get("/hello", (req, res) => {
	res.json("Hello World");
});

//GET list of users
app.get("/list-users", async (req, res) => {
	try {
		if (req.query.type == "full"){
			const template = "SELECT username, firstname, lastname, email FROM users";
			const response = await pool.query(template);	
			res.json({users:response.rows});
		}
		else if (req.query.type == "summary"){
			const template = "SELECT firstname, lastname FROM users";
			const response = await pool.query(template);
			res.json({users:response.rows});
		}
		}catch(err){
			console.log("in catch of /list-users" + err);
		}

});

//GET list of workshops
app.get("/list-workshops", async (req, res) => {
	try{
		const template = "SELECT distinct title, day as date, location FROM workshops";
		const response = await pool.query(template);
		
		let title;
		let date;
		let location;
		var arr;

		const workshopList = response.rows.map(function(item) {
			title = item.title;
			date = dateFormat(item.date, "yyyy-mm-dd");
			location = item.location;
			arr = {title, date, location};
			return arr;
		});
		res.json({workshops: workshopList});
	}
	catch(err){
		console.log("in catch of /list-workshops" + err);
	}
});

//GET list of attendees of certain wrokshops
app.get("/attendees", async (req, res) => {
	const title = req.query.title;
	const date = req.query.date;
	const location = req.query.location;
	console.log("title = " + title + " date = " + date + " location = " + location);

	const template = "SELECT users.firstname, users.lastname FROM users join enrollment on enrollment.username = users.username join workshops on enrollment.id = workshops.id WHERE workshops.title = $1 AND workshops.day = $2 AND workshops.location = $3"

	const response = await pool.query(template,[title, date, location]);
	console.log("title = " + title + "date = " + date + "location = " + location);
	try{
		if (response.rowCount == 0){
			res.json({ "error": "workshop does not exist"});
		}
		else{
			res.json({ attendees: response.rows});
		}
	}catch(err){
		console.log("in catch of /attendees" + err);
	}
});

//POST creating a user
app.post("/create-user", async (req, res) =>{
	const username = req.body.username;
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;
	const email = req.body.email;

	try{
		const template = "SELECT username FROM users WHERE username = $1;"; 
		const response = await pool.query(template, [username]);

		if (response.rowCount == 0){
			const template = "INSERT INTO users (username, firstname, lastname, email) values ($1, $2, $3, $4)";
			const response = await pool.query(template, [
				username,
				firstname,
				lastname,
				email
			]);
			res.json({ "status": "user added"});
		}
		else{
			res.json({"status": "username taken"});
		}
	}catch(err){
		console.log("In catch of /create-user" + err);
	}
});

//DEL deleting a user
app.delete("/delete-user", async (req, res) =>{
	try{
		const template = "DELETE FROM users WHERE username = $1";
		const response = await pool.query(template, [req.body.username]);
		res.json({"status": "deleted"});

	}catch(err){
		console.log("In catch of /delete-user" + err);
	}
});

//POST creating a workshop
app.post("/add-workshop", async (req,res) =>{
	const title = req.body.title;
	const date = req.body.date
	const location = req.body.location
	const maxseats = req.body.maxseats
	const instructor = req.body.instructor

	try{
		const template = "SELECT title FROM workshops WHERE title = $1 AND day = $2 AND location = $3";
		const response = await pool.query(template, [title, date, location]);

		if (response.rowCount == 0){
			const template = "INSERT INTO workshops (title, day, location, maxseats, instructor) values ($1, $2, $3, $4, $5)";
			const response = await pool.query(template, [
				title,
				date,
				location,
				maxseats,
				instructor
			]);
			res.json({"status":"workshop added"});
		}
		else{
			res.json({"status":"workshop already in database"})
		}
	}catch(err){
		console.log("In catch of /add-workshop" + err);
	}

});

//POST enrolling a user in a workshop
app.post("/enroll", async (req, res) =>{
	const title = req.body.title;
	const date = req.body.date;
	const location = req.body.location;
	const maxseats = req.body.maxseats;
	const instructor = req.body.instructor;
	const username = req.body.username;

	try{
		//If username not already in database
		const template = "SELECT username FROM users WHERE username = $1";
		const response = await pool.query(template, [username]);
		if (response.rowCount == 0){
			res.json({"status": "user not in database"});
		}
		
		//If workshop not already in database
		const template2 = "SELECT title FROM workshops WHERE title = $1";
		const response2 = await pool.query(template2, [title]);
		if(response2.rowCount == 0){
			res.json({"status":"workshop does not exist"});
		}

		//If user already enrolled
		const template3 = "SELECT enrollment.username, enrollment.id FROM enrollment join users on enrollment.username = users.username join workshops on enrollment.id = workshops.id WHERE enrollment.username = $1 AND workshops.title = $2 AND workshops.day = $3 AND workshops.location = $4";
		const response3 = await pool.query(template3, [
			username,
			title,
			date,
			location
		]);


		if(response3.rowCount != 0){
			res.json({"status":"user already enrolled"});
		}
		else{
			const template4 = "INSERT INTO enrollment(username, id) values ($1, $2)";
			
			//get corresponding id from workshops with title, date and location
			const template5 = "SELECT id FROM workshops WHERE title = $1 AND day = $2 AND location = $3";
			const response5 = await pool.query(template5, [title, date, location]);
			var id = response5.rows.map(function(item){
				return item.id;
			});
			id = id[0];
			const response4 = await pool.query(template4, [
				username,
				id
			]);
			res.json({"status":"user added"});
		}

	}catch(err){
		console.log("In catch of /enroll" + err);
	}
});
	/*
		else{	
			const template = "SELECT attendee FROM workshops WHERE workshop = $1";
			const response = await pool.query(template, [req.query.workshop]);
			if (response.rowCount == 0) {
				res.json({ "error": "workshop not found"});
			} else {
				const attendeesList = response.rows.map(function(item) {
					return item.attendee;
				});
				res.json({attendees: attendeesList });
			}
	}
	} catch (err) {
		res.json({ status: "error" });
	}
});

/*

//posting
app.post("/api", async (req, res) => {
	
	const attendee = req.body.attendee;
	const workshop = req.body.workshop;
	try {
		if(!req.body.attendee || !req.body.workshop){
			res.json({ error: 'parameters not given'});
		}
		const template = "SELECT workshop, attendee from workshops WHERE workshop = $1 AND attendee = $2";
		const response = await pool.query(template, [workshop, attendee]);
		console.log(response);
		if(response.rowCount != 0){
			res.json({error: 'attendee already enrolled'})
		}
		else{
			const template =
				"INSERT INTO workshops (workshop, attendee) VALUES ($1, $2)";
			const response = await pool.query(template, [
				workshop,
				attendee
			]);
			res.json({ attendee: attendee, workshop: workshop});
		}
	} catch (err) {
		res.json({error: 'attendee already enrolled'});
	}
});
*/
app.listen(app.get("port"), () => {
	console.log(`Find the server at http://localhost:${app.get("port")}`);
});
