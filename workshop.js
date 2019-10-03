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
			console.log("in catch" + err);
		}

});

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
		console.log("in catch" + err);
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
console.log("after listen");
