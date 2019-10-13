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
var newTicketID;
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
	return res.redirect('public/index.html');
}).listen(3000);

console.log("Server listening at : 3000");
app.use('/public', express.static(__dirname + '/public'));

//To allow the storage of spaces in text fields
app.use(bodyParser.text({ type: 'text/html' }))
app.use(bodyParser.text({ type: 'text/xml' }))

function primary_key_generator(){
    var ret = Math.round(((Math.random()*100000)/25)*Math.sin(3));
    newTicketID = ret; 
    return (
        ret
        //Number(String(Math.random()).slice(2)) + 
      //Date.now() + 
      //Math.round(performance.now())
    );
}

    //using Andrew's posting client info as template for posting info, his original is on master
    // get ticket input working first, then fix up reading gas and trucking companies from table
app.post('/index' , function(req,res){

    var ticket_id = primary_key_generator();

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const insertText = 'INSERT INTO ticket_table (ticket_id, gas_company, truck_company, driver_name, truck_number, trailer_number, material_location,\
                        water_type, water_total, solid_type, solid_total, wet_type, wet_total, ticket_notes, signature, date) VALUES ($1, $2, $3, $4, $5, $6,\
                        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)'
            
    client.query(insertText, [ticket_id, "", "", "", "", "", "", "", 0, "", 0, "", 0, "", "", "2000-08-08"],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
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
	return res.redirect('/pos1.html');  
});

app.post('/pos1' , function(req,res){

    var gasCo = req.body.gas;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET gas_company = $1 WHERE ticket_id = $2'
            
    client.query(updateText, [gasCo, newTicketID],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        }
        else{
            console.log(err,res);
            console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
            client.end();
        }
    })
  
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/pos2.html');  
});

app.post('/pos2' , function(req,res){

    var truckCo = req.body.truck;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET truck_company = $1 WHERE ticket_id = $2'
            
    client.query(updateText, [truckCo, newTicketID],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        }
        else{
            console.log(err,res);
            console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
            client.end();
        }
    })
  
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/pos3.html');  
});

app.post('/pos3' , function(req,res){

    var driver = req.body.text;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET driver_name = $1 WHERE ticket_id = $2'
            
    client.query(updateText, [driver, newTicketID],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        }
        else{
            console.log(err,res);
            console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
            client.end();
        }
    })
  
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/pos4.html');  
});

app.post('/pos4' , function(req,res){

    var trucknum = req.body.text;
    var trailernum = req.body.text2;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET truck_number = $1, trailer_number = $2 WHERE ticket_id = $3'
            
    client.query(updateText, [trucknum, trailernum, newTicketID],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        }
        else{
            console.log(err,res);
            console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
            client.end();
        }
    })
  
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/pos5.html');  
});

app.post('/pos5' , function(req,res){

    var loc = req.body.text;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET material_location = $1 WHERE ticket_id = $2'
            
    client.query(updateText, [loc, newTicketID],(err,res)=>{

        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        }
        else{
            console.log(err,res);
            console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
            client.end();
        }
    })
  
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/pos6.html');  
});