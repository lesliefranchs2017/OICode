var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
const pg = require('pg');
var app = express();
var sequelize = require('sequelize');
var client = new pg.Client();
const config = require('./config');
const { performance } = require('perf_hooks');

app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

//enabling css style sheet
app.use(express.static(__dirname + '/public'));

var configs = {
    user:config.db.user,
    host:config.db.host,
    database:config.db.database,
    password:config.db.password,
    port:config.db.port,
    ssl:config.db.ssl
}

// initializes a connection pool, keps idle connection open for 30 seconds, max 10 idle clients
var pool = new pg.Pool(configs);

const { Pool, Client } = require('pg')

// before conducting a query, acquire a client from the pool, run a query on the client, return client to pool
pool.connect(function(err, client, done) {
    if(err) {
        return console.error('Error fetching client from pool', err);
    }
});

// creating the server and default routes
app.get('/',function(req,res){
	res.set({
		'Access-Control-Allow-Origin' : '*' // creates access from any orgin
	});
	return res.redirect('/public/add_client.html');
}).listen(3000);

console.log("Server listening at : 3000");
app.use('/public', express.static(__dirname + '/public'));

//To allow the storage of spaces in text fields
app.use(bodyParser.text({ type: 'text/html' }))
app.use(bodyParser.text({ type: 'text/xml' }))

function primary_key_generator(){
    return (
      Number(String(Math.random()).slice(2)) +
      Date.now() +
      Math.round(performance.now())
    ).toString(36);
}

    //recieve request from the front end and store it into the database
app.post('/add_client' , function(req,res){

    var company_input = req.body.company;
    var clientName_input = req.body.name;
    var email_input = req.body.email;
    var phone_input = req.body.phone;
    var phoneType_input= req.body.phoneType;
    var addressOne_input = req.body.addressOne;
    var addressTwo_input = req.body.addressTwo;
    var city_input= req.body.city;
    var state_input = req.body.state;
    var zip_input = req.body.zip;
    var county_input = req.body.county;
    var startDate_input = req.body.startDate;
    var clientId_input = primary_key_generator();
    var companyStatus_input = req.body.toggle;
    var companyStatus = false;
	
    // checking if toggle switch is on or off
    if( companyStatus_input == "on" )
    {
        companyStatus = true;
    }

    else 
    {
        companyStatus = false;
    }

    // reversing the date for postgreSQL 
    startDate_input = startDate_input.split("/").reverse().join("-");

const client = new Client({
    user:config.db.user,
    host:config.db.host,
    database:config.db.database,
    password:config.db.password,
    port:config.db.port,
    ssl:config.db.ssl
  })

client.connect()

const insertText = 'INSERT INTO client_table (client_id, name, company, email, phone, phone_type, address_one,\
                    address_two, city, state, zip, county, start_date, company_status) VALUES ($1, $2, $3, $4, $5, $6,\
                    $7, $8, $9, $10, $11, $12, $13, $14)'

client.query(insertText, [clientId_input, clientName_input, company_input, email_input, phone_input, phoneType_input,
addressOne_input, addressTwo_input, city_input, state_input, zip_input, county_input, startDate_input, companyStatus],(err,res)=>{

    if (err)
    {
        console.log(err);
        client.end();
        //res.status(400).send(err);
    }
    else{
        console.log(err,res)
        console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );
        client.end();
    }
})

	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/success.html');
});

