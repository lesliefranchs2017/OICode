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
    key = generateKey();
    if (!checkIfIDInTable(key)) key = primary_key_generator();
    return key;
}

function generateKey(){
    var ret = Math.round(((Math.random()*100000)/15)*Math.sin(3));
    newTicketID = ret; 
    return ret;
}

function checkIfIDInTable(ticket_id){
    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

    client.connect()

    var rows = 0;
    var txt = 'SELECT ticket_id FROM ticket_table WHERE ticket_id = $1';
    client.query(txt, [ticket_id],(err,res)=>{
        
        if (err)
        {
            console.log(err);
            client.end();
            res.status(400).send(err);
        } else {
            console.log(err, res);
            console.log(res.rowCount);
            rows = res.rowCount;
            client.end();
        }
    });

    return rows == 0;
}

app.post('/index' , function(req,res){  // still broken :((((

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

    //var wrongID = true;

    //while(wrongID) {

        //var r = checkRows(ticket_id);
        //if (r == 0) {
            //wrongID = false;
            const insertText = 'INSERT INTO ticket_table (ticket_id, gas_company, truck_company, driver_name, truck_number, trailer_number, material_location,\
                                water_type, water_total, solid_type, solid_total, wet_type, wet_total, ticket_notes, signature, date) VALUES ($1, $2, $3, $4, $5, $6,\
                                $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)'
    
            client.query(insertText, [ticket_id, "", "", "", "", "", "", "", 0, "", 0, "", 0, "", "", "2000-08-08"],(err,res)=>{

                if (err)
                {
                    console.log(err);
                    client.end();
                    res.status(400).send(err);
                }else{
                    console.log(err,res)
                    console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );    
                    client.end();
                }
            })

            res.set({
                'Access-Control-Allow-Origin' : '*'
            });
            return res.redirect('/pos1.html');  
        //}
        //else {ticket_id = primary_key_generator();}
    //}
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

app.post('/pos6' , function(req,res){ // currently does not demand numeric values only, resulting in termination of server if string entered. FIX HERE

    var material = req.body.mat;
    var material_type = req.body.matType;
    var material_amount = req.body.matNum;
    var updateText = '';

    switch(material) {
        case "Water":
            updateText = 'UPDATE ticket_table SET water_type = $1, water_total = $2 WHERE ticket_id = $3'
            break;
        case "Solids":
            updateText = 'UPDATE ticket_table SET solid_type = $1, solid_total = $2 WHERE ticket_id = $3'
            break;
        case "Wet Solids":
            updateText = 'UPDATE ticket_table SET wet_type = $1, wet_total = $2 WHERE ticket_id = $3';
            break;
    }


    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()
            
    client.query(updateText, [material_type, material_amount, newTicketID],(err,res)=>{

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
	return res.redirect('/pos7.html');  
});

app.post('/pos7' , function(req,res){

    var notes = req.body.text;

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect()

    const updateText = 'UPDATE ticket_table SET ticket_notes = $1 WHERE ticket_id = $2'
            
    client.query(updateText, [notes, newTicketID],(err,res)=>{

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
	return res.redirect('/pos8.html');  
});

app.post('/pos8' , function(req,res){
    var signature = req.body.sig;
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    var today = year + "-" + month + "-" + day;
    today = today.split("/").reverse().join("-");

    const client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl  
    })

  
    client.connect();

    const updateText = 'UPDATE ticket_table SET signature = $1, date = $2 WHERE ticket_id = $3';
            
    client.query(updateText, [signature, today, newTicketID],(err,res)=>{

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
	return res.redirect('/pos9.html');  
});

// get function that will show data from database
app.get('/ajax_get_ticket', function(req, res) { // gets currently do not work on heroku

    client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl
      })
  
    client.connect()

    const selectText = "SELECT gas_company, truck_company, driver_name, truck_number, trailer_number, material_location, water_type,\
                        water_total, solid_type, solid_total, wet_type, wet_total\
                        FROM ticket_table WHERE ticket_id=$1";
    client.query(selectText, [newTicketID], function(err, result) {
        if (err) {
            throw err;
        }
  
        var size = result.rows.length;
        console.log(size);
        console.log(result);
        res.send(result);
  
        client.end();
  
      });
});

app.get('/ajax_get_gas_comp', function(req, res) {

    client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl
      })
  
    client.connect()

    const selectText = "SELECT gas_company FROM gas_companies_table";
    client.query(selectText, function(err, result) {
        if (err) {
            throw err;
        }

        var size = result.rows.length;
        console.log(size);
        console.log(result);
        res.send(result);
    });

});

app.get('/ajax_get_truck_comp', function(req, res) {

    client = new Client({
        user:config.db.user,
        host:config.db.host,
        database:config.db.database,
        password:config.db.password,
        port:config.db.port,
        ssl:config.db.ssl
      })
  
    client.connect()

    const selectText = "SELECT truck_company FROM truck_companies_table";
    client.query(selectText, function(err, result) {
        if (err) {
            throw err;
        }

        var size = result.rows.length;
        console.log(size);
        console.log(result);
        res.send(result);
    });

});