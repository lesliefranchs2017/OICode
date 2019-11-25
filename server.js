var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
const pg = require('pg');
var app = express();
var ejs = require('ejs');
var sequelize = require('sequelize');
var client = new pg.Client();
const config = require('./config');
const { performance } = require('perf_hooks');
var nodemailer = require('nodemailer');
var newTicketID;


// Set EJS as templating engine
app.set('view engine', 'html');
app.engine('html',require('ejs').renderFile);
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

//var DATABASE_URL=$(heroku config:get DATABASE_URL -a dataflow-project) node


//enabling css style sheet
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');

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
	return res.redirect('/public/index.html');
}).listen(process.env.PORT || 3000);

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
 return res.redirect('pos.html');
});

app.post('/pre_login', function(req, res) {


     return res.render("login.html",{success: 'none'});

 });

app.post('/get_clients', function(req, res) {

 client = new Client({
     user:config.db.user,
     host:config.db.host,
     database:config.db.database,
     password:config.db.password,
     port:config.db.port,
     ssl:config.db.ssl
   })

   client.connect()

   client.query("SELECT company FROM client_table", function(err, results) {
     if (err)
     {
         console.log(err);
         client.end();
     }
     else{
         //console.log(err,res)
         console.log("Success! Client sent!");
         client.end();
         }

     return res.render("edit_client.html",{names: results});

 });
});

app.post('/login', function(req, res) {

 client = new Client({
     user:config.db.user,
     host:config.db.host,
     database:config.db.database,
     password:config.db.password,
     port:config.db.port,
     ssl:config.db.ssl
   })

   client.connect()
   client.query("SELECT email, password, pin, access_rights, name FROM login_table", function(err, results) {
     if (err)
     {
         console.log(err);
         client.end();
     }
     else{
         //console.log(err,res)
         console.log("Success! Login info sent!");
         client.end();
         }

         var userName, user_pin, user_access_code;
         var user_email = req.body.email_id;
         var user_pass = req.body.pass_id;
         var emailBool = false;
         var passBool = false;
         var success = "false";

       //  for loop is how you can step through the database per row
         for(let step = 0;step < results.rows.length; step++)
         {
           if(results.rows[step].email == user_email)
           {
             emailBool = true;
             user_pin = results.rows[step].pin;
           }

           if(results.rows[step].password == user_pass)
           {
             passBool = true;
           }
         }

         if(emailBool == true && passBool == true)
         {
           success = "true";

         }
         else{
           success = "false";
         }

     client.end();

   if(success == "true")
   {
     return res.render("login_pin.html",{pin:user_pin, success: success});

   }

   if(success == "false")
   {
   //res.send('<script>alert("Login denied, re-enter email and password!")</script>');
    return res.render("login.html",{success: success});
    }

   });
 });

 app.post('/get_edit_client', function(req, res) {

   var company_name = req.body.key;

   var selectedCompany = company_name[0];

   client = new Client({
       user:config.db.user,
       host:config.db.host,
       database:config.db.database,
       password:config.db.password,
       port:config.db.port,
       ssl:config.db.ssl
     })

     client.connect()

     const getClient = 'SELECT *  FROM client_table WHERE company = $1'

     client.query(getClient, [selectedCompany], function(err,compResults){

       if (err)
         {
             console.log(err);
             client.end();
         }
         else{
             client.end();
             }




       return res.render("edit_selected_client.html",{client_info: compResults});

   });
 });

app.post('/update_client', function(req, res) {

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
 var clientId = req.body.key;
 var companyStatus_input = req.body.toggle;
 var companyStatus = false;
 //startDate_input = startDate_input.split("/").reverse().join("-");
 console.log(companyStatus_input);
 // checking if toggle switch is on or off
 if( companyStatus_input != "on" )
 {
     companyStatus = false;
 }

 else if(companyStatus_input == "on")
 {
     companyStatus = true;
 }

 // reversing the date for postgreSQL


 const client = new Client({
     user:config.db.user,
     host:config.db.host,
     database:config.db.database,
     password:config.db.password,
     port:config.db.port,
     ssl:config.db.ssl
 })


 client.connect()

 const updateTable = 'UPDATE client_table SET name = $1, company = $2, email = $3, phone = $4, phone_type = $5, address_one = $6,\
                     address_two = $7, city = $8, state = $9, zip = $10, county = $11, start_date = $12, company_status = $13\
                     WHERE client_id = $14'

 client.query(updateTable, [clientName_input, company_input, email_input, phone_input, phoneType_input, addressOne_input, addressTwo_input, city_input, state_input, zip_input, county_input, startDate_input, companyStatus, clientId],(err,res)=>{

     if (err)
     {
         console.log(err);
         client.end();
     }
     else{
         console.log(err,res);
         console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );
         client.end();
     }
 })
     return res.render("pos.html");

 });

 app.post('/view_clients', function(req, res) {

   client = new Client({
       user:config.db.user,
       host:config.db.host,
       database:config.db.database,
       password:config.db.password,
       port:config.db.port,
       ssl:config.db.ssl
     })

     client.connect()



       client.query("SELECT * FROM client_table ORDER BY company", function(err, results) {
         if (err)
         {
             console.log(err);
             client.end();
         }
         else{
             client.end();
             }

              //results.sort();
              //var myarray=["Bob", "Bully", "Amy"];
              //results.rows.company.sort();
              //results.sortBy('company');
               //Array now becomes ["Amy", "Bob", "Bully"]

             //console.log(myarray);

       return res.render("view_clients.html",{results: results});

   });
 });


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
    console.log("here is the signature and the date: ", signature, today)

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

            var gascompname = "";
            var truckcompname = "";
            var dname = "";
            var trucknum = "";
            var trailernum = "";
            var loc = "";
            var wattype = "";
            var watamnt = "";
            var soltype = "";
            var solamnt = "";
            var wettype = "";
            var wetamnt = "";
            var notes = "";
            var dsig = "";
            var watertotal = "";
            var solidtotal = "";
            var wetsolidtotal = "";
            var totalwithunits = "";
            var filename = "";

            const selectText = "SELECT gas_company, truck_company, driver_name, truck_number, trailer_number, material_location, water_type,\
                                water_total, solid_type, solid_total, wet_type, wet_total, ticket_notes, signature\
                                FROM ticket_table WHERE ticket_id=$1";

            client.query(selectText, [newTicketID],(err,result)=>{

                if (err)
                {
                    console.log(err);
                    client.end();
                    res.status(400).send(err);
                }
                else{
                    console.log(err,res);
                    console.log("DATA was succesfully inputed into database ");//+ JSON.stringify(data) );
                    gascompname = result.rows[0].gas_company;
                    truckcompname = result.rows[0].truck_company;
                    dname = result.rows[0].driver_name;
                    trucknum = result.rows[0].truck_number;
                    trailernum = result.rows[0].trailer_number;
                    loc = result.rows[0].material_location;
                    wattype = result.rows[0].water_type;
                    watamnt = result.rows[0].water_total;
                    soltype = result.rows[0].solid_type;
                    solamnt = result.rows[0].solid_total;
                    wettype = result.rows[0].wet_type;
                    wetamnt = result.rows[0].wet_total;
                    notes = result.rows[0].ticket_notes;
                    dsig = result.rows[0].signature;
                    console.log("now the dsig or submitted signature info is: ", dsig);
                    filename = "Ticket #" + newTicketID + ".pdf";

                    if (wattype == "" && watamnt == 0) watertotal = "n/a";
                    else watertotal = wattype + "                              " + watamnt + " BBLS";
                    if (soltype == "" && solamnt == 0) solidtotal = "n/a";
                    else solidtotal = soltype + "                              " + solamnt + " YARDS";
                    if (wettype == "" && wetamnt == 0) wetsolidtotal = "n/a";
                    else wetsolidtotal = wettype + "                              " + wetamnt + " BBLS";

                    if (watertotal == "n/a" && solidtotal == "n/a") totalwithunits = wetamnt + " BBLS";
                    else if (watertotal == "n/a" && wetsolidtotal == "n/a") totalwithunits = solamnt + " YARDS";
                    else totalwithunits = watamnt + " BBLS";

                    var fonts = {
                        Roboto: {
                            normal: 'fonts/Roboto-Regular.ttf',
                            bold: 'fonts/Roboto-Bold.ttf',
                            italics: 'fonts/Roboto-Thin.ttf',
                            bolditalics: 'fonts/Roboto-Medium.ttf'
                        }
                    };

                    var PdfPrinter = require('pdfmake');
                    var printer = new PdfPrinter(fonts);
                    var fs = require('fs');

                    var docdef = {
                        content: [
                            {
                                columns: [
                                    {
                                        alignment: 'left',
                                        table: {
                                            heights: 15,
                                            body: [
                                                ['TRUCK TICKET:', newTicketID],
                                                ['GAS COMPANY NAME: ', gascompname],
                                                ['DATE: ', today],
                                                ['TRUCK #: ', trucknum],
                                                ['TRAILER #: ', trailernum],
                                                ['TRUCKING COMPANY: ', truckcompname],
                                                ['LOCATION/WELL', loc]
                                            ]
                                        }
                                    },
                                    {
                                        alignment: 'center',
                                        table: {
                                            body: [
                                                [
                                                    {
                                                        image:
                                                        ['data:image/jpeg;base64,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YwAAAAEAAAAAAABSR0JDAAAAAwAAAABSZCAgZG91YkBv4AAAAAAAAAAAAEdybiBkb3ViQG/gAAAAAAAAAAAAQmwgIGRvdWJAb+AAAAAAAAAAAABCcmRUVW50RiNSbHQAAAAAAAAAAAAAAABCbGQgVW50RiNSbHQAAAAAAAAAAAAAAABSc2x0VW50RiNQeGxAcsAAAAAAAAAAAAp2ZWN0b3JEYXRhYm9vbAEAAAAAUGdQc2VudW0AAAAAUGdQcwAAAABQZ1BDAAAAAExlZnRVbnRGI1JsdAAAAAAAAAAAAAAAAFRvcCBVbnRGI1JsdAAAAAAAAAAAAAAAAFNjbCBVbnRGI1ByY0BZAAAAAAAAOEJJTQPtAAAAAAAQASwAAAABAAEBLAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAeDhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAjhCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADhwAAAAYAAAAAAAAAAAAAAZIAAAYaAAAAKQBHAHIAZQBlAG4ATABlAGEAZgAgAEUAbgB2AGkAcgBvAG4AbQBlAG4AdAAgAFMAZQByAHYAaQBjAGUAcwAgAGwAbwBnAG8AIAAtACAAMgAtADEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAABhoAAAGSAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAAGSAAAAAFJnaHRsb25nAAAGGgAAAAZzbGljZXNWbExzAAAAAU9iamMAAAABAAAAAAAFc2xpY2UAAAASAAAAB3NsaWNlSURsb25nAAAAAAAAAAdncm91cElEbG9uZwAAAAAAAAAGb3JpZ2luZW51bQAAAAxFU2xpY2VPcmlnaW4AAAANYXV0b0dlbmVyYXRlZAAAAABUeXBlZW51bQAAAApFU2xpY2VUeXBlAAAAAEltZyAAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAABkgAAAABSZ2h0bG9uZwAABhoAAAADdXJsVEVYVAAAAAEAAAAAAABudWxsVEVYVAAAAAEAAAAAAABNc2dlVEVYVAAAAAEAAAAAAAZhbHRUYWdURVhUAAAAAQAAAAAADmNlbGxUZXh0SXNIVE1MYm9vbAEAAAAIY2VsbFRleHRURVhUAAAAAQAAAAAACWhvcnpBbGlnbmVudW0AAAAPRVNsaWNlSG9yekFsaWduAAAAB2RlZmF1bHQAAAAJdmVydEFsaWduZW51bQAAAA9FU2xpY2VWZXJ0QWxpZ24AAAAHZGVmYXVsdAAAAAtiZ0NvbG9yVHlwZWVudW0AAAARRVNsaWNlQkdDb2xvclR5cGUAAAAATm9uZQAAAAl0b3BPdXRzZXRsb25nAAAAAAAAAApsZWZ0T3V0c2V0bG9uZwAAAAAAAAAMYm90dG9tT3V0c2V0bG9uZwAAAAAAAAALcmlnaHRPdXRzZXRsb25nAAAAAAA4QklNBCgAAAAAAAwAAAACP/AAAAAAAAA4QklNBBQAAAAAAAQAAAACOEJJTQQMAAAAABk8AAAAAQAAAKAAAAApAAAB4AAATOAAABkgABgAAf/Y/+IMWElDQ19QUk9GSUxFAAEBAAAMSExpbm8CEAAAbW50clJHQiBYWVogB84AAgAJAAYAMQAAYWNzcE1TRlQAAAAASUVDIHNSR0IAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1IUCAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARY3BydAAAAVAAAAAzZGVzYwAAAYQAAABsd3RwdAAAAfAAAAAUYmtwdAAAAgQAAAAUclhZWgAAAhgAAAAUZ1hZWgAAAiwAAAAUYlhZWgAAAkAAAAAUZG1uZAAAAlQAAABwZG1kZAAAAsQAAACIdnVlZAAAA0wAAACGdmlldwAAA9QAAAAkbHVtaQAAA/gAAAAUbWVhcwAABAwAAAAkdGVjaAAABDAAAAAMclRSQwAABDwAAAgMZ1RSQwAABDwAAAgMYlRSQwAABDwAAAgMdGV4dAAAAABDb3B5cmlnaHQgKGMpIDE5OTggSGV3bGV0dC1QYWNrYXJkIENvbXBhbnkAAGRlc2MAAAAAAAAAEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAADzUQABAAAAARbMWFlaIAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9kZXNjAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMuY2gAAAAAAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMuY2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0IFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0IFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRlc2MAAAAAAAAALFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAACxSZWZlcmVuY2UgVmlld2luZyBDb25kaXRpb24gaW4gSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2aWV3AAAAAAATpP4AFF8uABDPFAAD7cwABBMLAANcngAAAAFYWVogAAAAAABMCVYAUAAAAFcf521lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAKPAAAAAnNpZyAAAAAAQ1JUIGN1cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAF4AYwBoAG0AcgB3AHwAgQCGAIsAkACVAJoAnwCkAKkArgCyALcAvADBAMYAywDQANUA2wDgAOUA6wDwAPYA+wEBAQcBDQETARkBHwElASsBMgE4AT4BRQFMAVIBWQFgAWcBbgF1AXwBgwGLAZIBmgGhAakBsQG5AcEByQHRAdkB4QHpAfIB+gIDAgwCFAIdAiYCLwI4AkECSwJUAl0CZwJxAnoChAKOApgCogKsArYCwQLLAtUC4ALrAvUDAAMLAxYDIQMtAzgDQwNPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQGBBMEIAQtBDsESARVBGMEcQR+BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBZYFpgW1BcUF1QXlBfYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG0QbjBvUHBwcZBysHPQdPB2EHdAeGB5kHrAe/B9IH5Qf4CAsIHwgyCEYIWghuCIIIlgiqCL4I0gjnCPsJEAklCToJTwlkCXkJjwmkCboJzwnlCfsKEQonCj0KVApqCoEKmAquCsUK3ArzCwsLIgs5C1ELaQuAC5gLsAvIC+EL+QwSDCoMQwxcDHUMjgynDMAM2QzzDQ0NJg1ADVoNdA2ODakNww3eDfgOEw4uDkkOZA5/DpsOtg7SDu4PCQ8lD0EPXg96D5YPsw/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExExEU8RbRGMEaoRyRHoEgcSJhJFEmQShBKjEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAWAxYmFkkWbBaPFrIW1hb6Fx0XQRdlF4kXrhfSF/cYGxhAGGUYihivGNUY+hkgGUUZaxmRGbcZ3RoEGioaURp3Gp4axRrsGxQbOxtjG4obshvaHAIcKhxSHHscoxzMHPUdHh1HHXAdmR3DHeweFh5AHmoelB6+HukfEx8+H2kflB+/H+ogFSBBIGwgmCDEIPAhHCFIIXUhoSHOIfsiJyJVIoIiryLdIwojOCNmI5QjwiPwJB8kTSR8JKsk2iUJJTglaCWXJccl9yYnJlcmhya3JugnGCdJJ3onqyfcKA0oPyhxKKIo1CkGKTgpaymdKdAqAio1KmgqmyrPKwIrNitpK50r0SwFLDksbiyiLNctDC1BLXYtqy3hLhYuTC6CLrcu7i8kL1ovkS/HL/4wNTBsMKQw2zESMUoxgjG6MfIyKjJjMpsy1DMNM0YzfzO4M/E0KzRlNJ402DUTNU01hzXCNf02NzZyNq426TckN2A3nDfXOBQ4UDiMOMg5BTlCOX85vDn5OjY6dDqyOu87LTtrO6o76DwnPGU8pDzjPSI9YT2hPeA+ID5gPqA+4D8hP2E/oj/iQCNAZECmQOdBKUFqQaxB7kIwQnJCtUL3QzpDfUPARANER0SKRM5FEkVVRZpF3kYiRmdGq0bwRzVHe0fASAVIS0iRSNdJHUljSalJ8Eo3Sn1KxEsMS1NLmkviTCpMcky6TQJNSk2TTdxOJU5uTrdPAE9JT5NP3VAnUHFQu1EGUVBRm1HmUjFSfFLHUxNTX1OqU/ZUQlSPVNtVKFV1VcJWD1ZcVqlW91dEV5JX4FgvWH1Yy1kaWWlZuFoHWlZaplr1W0VblVvlXDVchlzWXSddeF3JXhpebF69Xw9fYV+zYAVgV2CqYPxhT2GiYfViSWKcYvBjQ2OXY+tkQGSUZOllPWWSZedmPWaSZuhnPWeTZ+loP2iWaOxpQ2maafFqSGqfavdrT2una/9sV2yvbQhtYG25bhJua27Ebx5veG/RcCtwhnDgcTpxlXHwcktypnMBc11zuHQUdHB0zHUodYV14XY+dpt2+HdWd7N4EXhueMx5KnmJeed6RnqlewR7Y3vCfCF8gXzhfUF9oX4BfmJ+wn8jf4R/5YBHgKiBCoFrgc2CMIKSgvSDV4O6hB2EgITjhUeFq4YOhnKG14c7h5+IBIhpiM6JM4mZif6KZIrKizCLlov8jGOMyo0xjZiN/45mjs6PNo+ekAaQbpDWkT+RqJIRknqS45NNk7aUIJSKlPSVX5XJljSWn5cKl3WX4JhMmLiZJJmQmfyaaJrVm0Kbr5wcnImc951kndKeQJ6unx2fi5/6oGmg2KFHobaiJqKWowajdqPmpFakx6U4pammGqaLpv2nbqfgqFKoxKk3qamqHKqPqwKrdavprFys0K1ErbiuLa6hrxavi7AAsHWw6rFgsdayS7LCszizrrQltJy1E7WKtgG2ebbwt2i34LhZuNG5SrnCuju6tbsuu6e8IbybvRW9j74KvoS+/796v/XAcMDswWfB48JfwtvDWMPUxFHEzsVLxcjGRsbDx0HHv8g9yLzJOsm5yjjKt8s2y7bMNcy1zTXNtc42zrbPN8+40DnQutE80b7SP9LB00TTxtRJ1MvVTtXR1lXW2Ndc1+DYZNjo2WzZ8dp22vvbgNwF3IrdEN2W3hzeot8p36/gNuC94UThzOJT4tvjY+Pr5HPk/OWE5g3mlucf56noMui86Ubp0Opb6uXrcOv77IbtEe2c7ijutO9A78zwWPDl8XLx//KM8xnzp/Q09ML1UPXe9m32+/eK+Bn4qPk4+cf6V/rn+3f8B/yY/Sn9uv5L/tz/bf///+0ADEFkb2JlX0NNAAH/7gAOQWRvYmUAZIAAAAAB/9sAhAAMCAgICQgMCQkMEQsKCxEVDwwMDxUYExMVExMYEQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQ0LCw0ODRAODhAUDg4OFBQODg4OFBEMDAwMDBERDAwMDAwMEQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAApAKADASIAAhEBAxEB/90ABAAK/8QBPwAAAQUBAQEBAQEAAAAAAAAAAwABAgQFBgcICQoLAQABBQEBAQEBAQAAAAAAAAABAAIDBAUGBwgJCgsQAAEEAQMCBAIFBwYIBQMMMwEAAhEDBCESMQVBUWETInGBMgYUkaGxQiMkFVLBYjM0coLRQwclklPw4fFjczUWorKDJkSTVGRFwqN0NhfSVeJl8rOEw9N14/NGJ5SkhbSVxNTk9KW1xdXl9VZmdoaWprbG1ub2N0dXZ3eHl6e3x9fn9xEAAgIBAgQEAwQFBgcHBgU1AQACEQMhMRIEQVFhcSITBTKBkRShsUIjwVLR8DMkYuFygpJDUxVjczTxJQYWorKDByY1wtJEk1SjF2RFVTZ0ZeLys4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9ic3R1dnd4eXp7fH/9oADAMBAAIRAxEAPwD1N72saXvIa1oJc46AAckrM6B1hvU68jX3VWu2g8+k4l1Dv832f2FmfW/rGxv7Lod7ngOyXDs0/Qp/659J/wDwf/GrmukdWs6f1E31+70jtsZ+/W6N7f7Lvo/y1dxcqDhuRrJlP6kf3Iyn/wA9yuZ+JDHzUYDXHj0zn+/6f/G301JDovqyKWX0u312NDmOHcHVcN9bf8ZL+n556P0ChubnNeKrbHB1jBaTt+y0UUEW5OT+/wC/9FZ+j/S/pPTpEUaLqggixqC96kvKb/rt/jJ6OwZnVuntGJoXOux3NYASBtddj2u9B7p2M9ZekdO6jZkdJo6j1DHPTH2Viy7Hvc2ap/Nsf7f+n6dn+lqqt/RpKbySqv6r0xlH2l+ZQ3H3iv1jYwM3niv1C7Z6n8hGvvox6nXZFjaamavsscGtA/lPd7WpKSJKviZ+DnMNmFk1ZTGmHOpe2wA+BdWXIz3sYxz3uDWNBLnEwABy5xSUySVXE6p0zOc5uFl0ZTmavFNjLCP63pudtRMjMw8Xb9qvro3Tt9R7WTH0tu8t+jKSkySq3dU6ZRfXj35dFV9wBqqfYxr3g6N9Njnbn7v5KyPr71TP6T9WMnO6dd6GVW+lrLNrXwH211P9lzbK/oP/AHUlPQpLA+onU87q31Vws/qFvr5VpuFlu1rJ2XXUs9lTa6/5utn5i1Ler9KpyRiXZuPXkmAKH2sbZJ+j+ic7ekptpJKpb1bpVF3oXZuPVdMem+1jXT/Uc7ckptpKL7K62GyxwYwcucQAP7RXkmB9a/r/APWXNy7uk5tWHVSBY3GsNDGNa8ubRS1+RTbbfa/03b3v/R/8T+iSU//Qnn5b7Lb8uzV9jy+D4uPtb/ZWVRaWZIcTMxv/ALRK6v6z/VrMpsuvxa3XY1jjYNg3Fh+m9jmN92z6Wx65vpHSuodSe12PRZY2wh24NIbtH8373Qz3fvq1zmWeTPgOL5IxjLHW0Z8Xq4/3eDhjxPMfd8kDljkiTMyI2/nL/c/vPe/U/Iud0rIqA3HHe70gePc3fs/7c3f564f/ABPU4uR1rMy8kizNqx2vpL9XfpXu+2Xt3f4T+aZv/wCG/wCEXpfROljpeCMcuD7XE2XOHBeY+jP5rGt2Lz7r31K+sfQOtv679UwbKXOdYKag31KvU1vx/s79teViPd/Nsr/S1/6P9BXkKPmZxnmnKHyk6fxeg5PHPHy+KGT54xAPh/V/wXS+tn10+t/R+rZlGJ0ht3SsYMLc2ym81lrq2WWl+RWRj7WWvfWh3fWLM+sn+LPrOfnVVVWsNlIbSHbYYanNd+kc9273rK6h1r/GZ9Y8OzpD+jOoqyRttcMayjc3uw3593oVNd/24tuv6pdU6R/i46n0hwGXn5XqXCnHBdBeax6LCdrrtra927YxQs7yX1N+pWZ9Z8f1H5QxOmdPvIqAYHl1zvStv9Nm6trP0bcffc/f/oUT62dXwuufXO7E67mPwuh9Ptfjja1zyDUNthrrrZd+nyb936d1X6Khdt/iu6d1Dp31evo6hjWYlzsyx7a7W7XFpbTtfH7vtWH9a/qr13pX1kf9ZugYjM+m4my/FLfUIe4CvIa/Gcd99OR/O7qP01Vv8hJLyuX1L6vfVzreJ1X6mdQsyK2g/aabWvYYDm+pjvffVR6+Pl1fmfpH0W0+r6n8zs3f8ZnWvt31ip6FkZJxOkYwqdlWAOeJt/SvyH1V7vX9Gj0/Qq2fzq0ekZf1v6x1rFDvq5jdN6ZW6M1uTj7A5hHvcLchjLnWt2/q9ePRs9T+k/ov5ux9fvqh1XI6rR9ZOhVi7KoDPXx/aXE1EupuZXb+jv8AY70bqP3PT9JJTxHWj9T+mPxOofUzq1xz6H+9trXtcPaduRXddRjs+l+ivxv0ldzLv5r+c37f+NDPHU+j/VjqVjGzlY117mDUBz2Ylj2N3fuuVqnqf156pk42NifVjG6e5r2uyLsjFLKnNBh7Xvyms9Kj85/2f7Rlf6FXP8a/Q+p59PSa+lYNmQ3HZktezHZubWHNx21thu3a32O2JKcb60fUGvA+rTfrDdm25nUD6Ls31trmO9Yspik7fWb6Lra9vq22fo2f4NaGXl5GX/ibqtyXm2xr2Vb3aktqzPQqn+rVWxi6X664Gdl/UWzDxcey/KLcWKGCXyy2h9nt/kNY5YLui9X/APGmZ0z7Fd9vFu44mw+rH2x1383/AMV70kNWnrmV0b/FJgPw3uqyMy+7FruYYdWH35dttjD+a/0abGVv/Mf+kXOYWD/i8s6KXdR6tbT1yxrnFoqtdVXZrsqsAxn/AGj/AIez1ff/AIKxdv0/6oZfVf8AFri9GymHC6jS+2+gXgjZaL8iyr1mt93p3U2+n/xd3qfpFhYOZ9deh4g6Rb9V2Z1lA2UZDsd1wAmWtfdjb6chrJ9v6aj/AIVJLq/4sOvDN+rvUun9WuDsPprGg22v0ZjXMsnHdd9L06PRt9P3+yr9H/g2LkH9P/xYtrdjs6rnfaQ2GZb8cfZ90exz8f7P9q9N3/bn8td6/wCr/wBYuqfUHLwM/GxsfrORscG1BlfqtpsryKmZXoj7PXkW+nYz9G/0Gb2fQ/SrG+q+f9dOmdKd9W8P6tOF7n2xn5ANVI9QlzrMrfW6nK9Odn6PJ/S0sqr2JIY/4u8c/WX6tdX+rPUrLG4Nb8d9fpuG+sPJvdTU61t1ba/WxN383/hLFh/UD6pdO+tduW3qFl1QxWVPr9AsEmw2h+/16r/9C36K6z/FJ0fqnSx1T9oYd2GLRjej67dpdsGRv2/1dzNyH/il6L1fpl/UT1HCuxBZVQ2s3MLQ4tdfv2/1d6SX/9H1K6s202VAlpe0t3DkSIlZH1czGD6pYOQ0F32fDax7Bod9DPRur/s20vrW0h0/QP8AWd/1TkOqP0h5NUdScenV5ravVNjq2+lW8O+nY2k7bDsa709+/b/1tM/qrG9Pp6g2tz6rtpAE7h6g/QewjfutudTTt/M9X9J9B6vpIpQ/aCMirHcyHWVvsLgZA2Gpuz+166r4XUjlXZVRpdX9mcQCZ94DratzQ5lf+g/M9Sv/AIT1PUV5JJTnYfVxlYl+SKgPQbvhrtwPt9T0nP2t2ZDPo31f4JOzqpfg5GU3Hf6mMdpx3ENeXhrHuq3H9H9Oz0vU3ei/+d9T0loJJKc93VS3p9ua6hzPTsLPSeQ0xv8ASbY86+nuafV/4NSzeqDDxKsp1RtY8F1npndtaK7LzYIG61n6PZ+jb/wivJJKa9+RdVbjMZWHtyHlj3FxBZDH3boDH7/5pzfpMUG9QYeouwdjhtZItg7C/wCk+jdt2+o2p9dv0/8Az2raSSkGLmVZJtawgPpsdXYyQXDaS1rntH0PU272KGbmjEdjgtBF9oqLi6I3aN2sAfZa7d+axn/G+nWrSSSmoc4DqQwNoE1C3eXQTJsbtZXHv2+l702P1B12ffiGksbT9G0zDo2bo3NY1385/gX3bP8AD+j6lPqXEklNKjqPrVZFnpOb9lltjTz6jAXW1N/ea32bbf8ACb0sjqIp+zDa1v2nXda/02D6P6MP2v35L/U/Q0f4X07f9GrqSSmo/O29SZgbR76/U3l0Hlw2srj3/Q9yerOFmffhFoa6kNcDu3FwcAdzmtG2r6W3bY/1X/6P0laSSU//2ThCSU0EIQAAAAAAWQAAAAEBAAAADwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAAABUAQQBkAG8AYgBlACAAUABoAG8AdABvAHMAaABvAHAAIABDAFMANQAuADEAAAABADhCSU0EBgAAAAAABwAEAAAAAQEA/+E8KGh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjEgNjQuMTQwOTQ5LCAyMDEwLzEyLzA3LTEwOjU3OjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczppbGx1c3RyYXRvcj0iaHR0cDovL25zLmFkb2JlLmNvbS9pbGx1c3RyYXRvci8xLjAvIiB4bWxuczp4bXBUUGc9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC90L3BnLyIgeG1sbnM6c3REaW09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9EaW1lbnNpb25zIyIgeG1sbnM6eG1wRz0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL2cvIiB4bWxuczpwZGY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGRmLzEuMy8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDEzLTAxLTEyVDIyOjUwOjQ4LTA3OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxMy0wMS0xMlQyMjo1MDo0OC0wNzowMCIgeG1wOkNyZWF0ZURhdGU9IjIwMTMtMDEtMDNUMTE6Mjk6MjktMDc6MDAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgSWxsdXN0cmF0b3IgQ1M1IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjYyMEI0NjJFNDU1REUyMTFBM0NGQjBGNUREMTg3NjlEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkZBN0YxMTc0MDcyMDY4MTE4OEM2OTE1MUM0QTI0RjU4IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InV1aWQ6NUQyMDg5MjQ5M0JGREIxMTkxNEE4NTkwRDMxNTA4QzgiIHhtcE1NOlJlbmRpdGlvbkNsYXNzPSJwcm9vZjpwZGYiIGlsbHVzdHJhdG9yOlN0YXJ0dXBQcm9maWxlPSJQcmludCIgeG1wVFBnOkhhc1Zpc2libGVPdmVycHJpbnQ9IkZhbHNlIiB4bXBUUGc6SGFzVmlzaWJsZVRyYW5zcGFyZW5jeT0iRmFsc2UiIHhtcFRQZzpOUGFnZXM9IjEiIHBkZjpQcm9kdWNlcj0iQWRvYmUgUERGIGxpYnJhcnkgOS45MCIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIj4gPGRjOnRpdGxlPiA8cmRmOkFsdD4gPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5HcmVlbkxlYWYgRW52aXJvbm1lbnQgU2VydmljZXMgbG9nbyAtIDI8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnRpdGxlPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0idXVpZDpmZmE3MGE2Yi05Yzg4LTk5NDctYWVkMi01YmY4OWFlZmRjMDUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RkE3RjExNzQwNzIwNjgxMTg4QzY5MTUxQzRBMjRGNTgiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0idXVpZDo1RDIwODkyNDkzQkZEQjExOTE0QTg1OTBEMzE1MDhDOCIgc3RSZWY6cmVuZGl0aW9uQ2xhc3M9InByb29mOnBkZiIvPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpGQTdGMTE3NDA3MjA2ODExODhDNjkxNTFDNEEyNEY1OCIgc3RFdnQ6d2hlbj0iMjAxMy0wMS0wM1QxMToyOToyNy0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgSWxsdXN0cmF0b3IgQ1M1IiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gYXBwbGljYXRpb24vcGRmIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvanBlZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NjIwQjQ2MkU0NTVERTIxMUEzQ0ZCMEY1REQxODc2OUQiIHN0RXZ0OndoZW49IjIwMTMtMDEtMTJUMjI6NTA6NDgtMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDUzUuMSBXaW5kb3dzIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wVFBnOk1heFBhZ2VTaXplIHN0RGltOnc9IjguNTAwMDAwIiBzdERpbTpoPSIxMS4wMDAwMDAiIHN0RGltOnVuaXQ9IkluY2hlcyIvPiA8eG1wVFBnOlBsYXRlTmFtZXM+IDxyZGY6U2VxPiA8cmRmOmxpPkN5YW48L3JkZjpsaT4gPHJkZjpsaT5NYWdlbnRhPC9yZGY6bGk+IDxyZGY6bGk+WWVsbG93PC9yZGY6bGk+IDxyZGY6bGk+QmxhY2s8L3JkZjpsaT4gPC9yZGY6U2VxPiA8L3htcFRQZzpQbGF0ZU5hbWVzPiA8eG1wVFBnOlN3YXRjaEdyb3Vwcz4gPHJkZjpTZXE+IDxyZGY6bGk+IDxyZGY6RGVzY3JpcHRpb24geG1wRzpncm91cE5hbWU9IkRlZmF1bHQgU3dhdGNoIEdyb3VwIiB4bXBHOmdyb3VwVHlwZT0iMCI+IDx4bXBHOkNvbG9yYW50cz4gPHJkZjpTZXE+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJXaGl0ZSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkJsYWNrIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMDAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDTVlLIFJlZCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDTVlLIFllbGxvdyIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQ01ZSyBHcmVlbiIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjEwMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDTVlLIEN5YW4iIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjEwMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkNNWUsgQmx1ZSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDTVlLIE1hZ2VudGEiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MTUgTT0xMDAgWT05MCBLPTEwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxNC45OTk5OTgiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjkwLjAwMDAwMCIgeG1wRzpibGFjaz0iMTAuMDAwMDAyIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT05MCBZPTg1IEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iOTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iODUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09ODAgWT05NSBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjgwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijk1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTUwIFk9MTAwIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iNTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTM1IFk9ODUgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIzNS4wMDAwMDQiIHhtcEc6eWVsbG93PSI4NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTUgTT0wIFk9OTAgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1LjAwMDAwMSIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjkwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MjAgTT0wIFk9MTAwIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTkuOTk5OTk4IiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTAgTT0wIFk9MTAwIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NzUgTT0wIFk9MTAwIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNzUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9ODUgTT0xMCBZPTEwMCBLPTEwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI4NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMTAuMDAwMDAyIiB4bXBHOnllbGxvdz0iMTAwLjAwMDAwMCIgeG1wRzpibGFjaz0iMTAuMDAwMDAyIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTkwIE09MzAgWT05NSBLPTMwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI5MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMzAuMDAwMDAyIiB4bXBHOnllbGxvdz0iOTUuMDAwMDAwIiB4bXBHOmJsYWNrPSIzMC4wMDAwMDIiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NzUgTT0wIFk9NzUgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI3NS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSI3NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTgwIE09MTAgWT00NSBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjgwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMC4wMDAwMDIiIHhtcEc6eWVsbG93PSI0NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTcwIE09MTUgWT0wIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNzAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjE0Ljk5OTk5OCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz04NSBNPTUwIFk9MCBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijg1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI1MC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MTAwIE09OTUgWT01IEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI5NS4wMDAwMDAiIHhtcEc6eWVsbG93PSI1LjAwMDAwMSIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MTAwIE09MTAwIFk9MjUgSz0yNSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMTAwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMDAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMjUuMDAwMDAwIiB4bXBHOmJsYWNrPSIyNS4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NzUgTT0xMDAgWT0wIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNzUuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTAgTT0xMDAgWT0wIEs9MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iNTAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MzUgTT0xMDAgWT0zNSBLPTEwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIzNS4wMDAwMDQiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjM1LjAwMDAwNCIgeG1wRzpibGFjaz0iMTAuMDAwMDAyIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTEwIE09MTAwIFk9NTAgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMC4wMDAwMDIiIHhtcEc6bWFnZW50YT0iMTAwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjUwLjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTk1IFk9MjAgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI5NS4wMDAwMDAiIHhtcEc6eWVsbG93PSIxOS45OTk5OTgiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTI1IE09MjUgWT00MCBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjI1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIyNS4wMDAwMDAiIHhtcEc6eWVsbG93PSIzOS45OTk5OTYiIHhtcEc6YmxhY2s9IjAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTQwIE09NDUgWT01MCBLPTUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM5Ljk5OTk5NiIgeG1wRzptYWdlbnRhPSI0NS4wMDAwMDAiIHhtcEc6eWVsbG93PSI1MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjUuMDAwMDAxIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTUwIE09NTAgWT02MCBLPTI1IiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSI1MC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iNTAuMDAwMDAwIiB4bXBHOnllbGxvdz0iNjAuMDAwMDA0IiB4bXBHOmJsYWNrPSIyNS4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTUgTT02MCBZPTY1IEs9NDAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjU1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSI2MC4wMDAwMDQiIHhtcEc6eWVsbG93PSI2NS4wMDAwMDAiIHhtcEc6YmxhY2s9IjM5Ljk5OTk5NiIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0yNSBNPTQwIFk9NjUgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIyNS4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMzkuOTk5OTk2IiB4bXBHOnllbGxvdz0iNjUuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0zMCBNPTUwIFk9NzUgSz0xMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMzAuMDAwMDAyIiB4bXBHOm1hZ2VudGE9IjUwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9Ijc1LjAwMDAwMCIgeG1wRzpibGFjaz0iMTAuMDAwMDAyIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTM1IE09NjAgWT04MCBLPTI1IiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIzNS4wMDAwMDQiIHhtcEc6bWFnZW50YT0iNjAuMDAwMDA0IiB4bXBHOnllbGxvdz0iODAuMDAwMDAwIiB4bXBHOmJsYWNrPSIyNS4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NDAgTT02NSBZPTkwIEs9MzUiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM5Ljk5OTk5NiIgeG1wRzptYWdlbnRhPSI2NS4wMDAwMDAiIHhtcEc6eWVsbG93PSI5MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjM1LjAwMDAwNCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz00MCBNPTcwIFk9MTAwIEs9NTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjM5Ljk5OTk5NiIgeG1wRzptYWdlbnRhPSI3MC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSI1MC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9NTAgTT03MCBZPTgwIEs9NzAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjUwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI3MC4wMDAwMDAiIHhtcEc6eWVsbG93PSI4MC4wMDAwMDAiIHhtcEc6YmxhY2s9IjcwLjAwMDAwMCIvPiA8L3JkZjpTZXE+IDwveG1wRzpDb2xvcmFudHM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpsaT4gPHJkZjpsaT4gPHJkZjpEZXNjcmlwdGlvbiB4bXBHOmdyb3VwTmFtZT0iR3JheXMiIHhtcEc6Z3JvdXBUeXBlPSIxIj4gPHhtcEc6Q29sb3JhbnRzPiA8cmRmOlNlcT4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgWT0wIEs9MTAwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIxMDAuMDAwMDAwIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIFk9MCBLPTkwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI4OS45OTk0MDUiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgWT0wIEs9ODAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9Ijc5Ljk5ODc5NSIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBZPTAgSz03MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iNjkuOTk5NzAyIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIFk9MCBLPTYwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSI1OS45OTkxMDQiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgWT0wIEs9NTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjUwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBZPTAgSz00MCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iMzkuOTk5NDAxIi8+IDxyZGY6bGkgeG1wRzpzd2F0Y2hOYW1lPSJDPTAgTT0wIFk9MCBLPTMwIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSIwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIyOS45OTg4MDIiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgWT0wIEs9MjAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjAuMDAwMDAwIiB4bXBHOnllbGxvdz0iMC4wMDAwMDAiIHhtcEc6YmxhY2s9IjE5Ljk5OTcwMSIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MCBZPTAgSz0xMCIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iOS45OTkxMDMiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTAgWT0wIEs9NSIgeG1wRzptb2RlPSJDTVlLIiB4bXBHOnR5cGU9IlBST0NFU1MiIHhtcEc6Y3lhbj0iMC4wMDAwMDAiIHhtcEc6bWFnZW50YT0iMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMDAwMCIgeG1wRzpibGFjaz0iNC45OTg4MDMiLz4gPC9yZGY6U2VxPiA8L3htcEc6Q29sb3JhbnRzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6bGk+IDxyZGY6bGk+IDxyZGY6RGVzY3JpcHRpb24geG1wRzpncm91cE5hbWU9IkJyaWdodHMiIHhtcEc6Z3JvdXBUeXBlPSIxIj4gPHhtcEc6Q29sb3JhbnRzPiA8cmRmOlNlcT4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9MCBNPTEwMCBZPTEwMCBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwMC4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09NzUgWT0xMDAgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIwLjAwMDAwMCIgeG1wRzptYWdlbnRhPSI3NS4wMDAwMDAiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0wIE09MTAgWT05NSBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjEwLjAwMDAwMiIgeG1wRzp5ZWxsb3c9Ijk1LjAwMDAwMCIgeG1wRzpibGFjaz0iMC4wMDAwMDAiLz4gPHJkZjpsaSB4bXBHOnN3YXRjaE5hbWU9IkM9ODUgTT0xMCBZPTEwMCBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49Ijg1LjAwMDAwMCIgeG1wRzptYWdlbnRhPSIxMC4wMDAwMDIiIHhtcEc6eWVsbG93PSIxMDAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz0xMDAgTT05MCBZPTAgSz0wIiB4bXBHOm1vZGU9IkNNWUsiIHhtcEc6dHlwZT0iUFJPQ0VTUyIgeG1wRzpjeWFuPSIxMDAuMDAwMDAwIiB4bXBHOm1hZ2VudGE9IjkwLjAwMDAwMCIgeG1wRzp5ZWxsb3c9IjAuMDAwMDAwIiB4bXBHOmJsYWNrPSIwLjAwMDAwMCIvPiA8cmRmOmxpIHhtcEc6c3dhdGNoTmFtZT0iQz02MCBNPTkwIFk9MCBLPTAiIHhtcEc6bW9kZT0iQ01ZSyIgeG1wRzp0eXBlPSJQUk9DRVNTIiB4bXBHOmN5YW49IjYwLjAwMDAwNCIgeG1wRzptYWdlbnRhPSI5MC4wMDAwMDAiIHhtcEc6eWVsbG93PSIwLjAwMzA5OSIgeG1wRzpibGFjaz0iMC4wMDMwOTkiLz4gPC9yZGY6U2VxPiA8L3htcEc6Q29sb3JhbnRzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6bGk+IDwvcmRmOlNlcT4gPC94bXBUUGc6U3dhdGNoR3JvdXBzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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q7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq/wD/0vVOKuxV2KuxV2KuxV2KuxV2Kvl7/nJO0MPmVJe01rG33NJH/wAaZVLm872gKn/mvNNGvPqV9b3fT0ZUf/gWDZB18DRBfdmZD2TsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdirsVdir/AP/T9U4q7FXYq7FXYq7FXYq7FXYq+fv+cpNP4zadfAfaWWIn/VKOn/E3yubpO0o7g+94RlbpX3B5N1Ianotjeg19W3iY/MqOX/DZeHsMUuKIPknGFtdirsVdirsVdirsVYBJ+fXkqNij6nGGUkEcJOo/554qt/5X95I/6ukf/ASf9U8Vd/yv7yR/1dI/+Ak/6p4qz23uEuYknhPKORQynxBFVOKqmKuxV2KuxVjWjfmR5f1rUZNF0+8SW/h5h4qMCOB4SU5qqtwP8n+t9nFWS4q7FUh0vz3ouq6nPoVlcrLqFqGMsQVgVCMsb/Ey8Phd1X4WxVPsVdirsVdiqS+avOmk+VIUutbnFtDI3BWZWILU5cf3av8AsqcVTDS9TttVtYr+xkEttOgeN16FWFVOKorFWpJFjUu5CqoqSdgAO5xVj/lT8wdD82NKmh3S3Rg4mTirgLyrx+J1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q7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FVpiRmDkAsvQ03FcVXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FXYq7FX/0fVOKuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV2KuxV//Z'],
                                                        width: 250,
                                                    }
                                                ],
                                                ['\nMESA FACILITY\n15655 45 1/2 Road\nDebeque, CO  81630\n (970) 283-8992']
                                            ]
                                        },
                                        layout: 'noBorders'
                                    },
                                ]
                            },
                            {
                                text:'\n\n_______________________________________________________________________________________________\n\n'
                            },
                            {
                                style: 'header',
                                text: 'Notes\n'
                            },
                            {
                                fontSize: 6,
                                text: '\n'
                            },
                            {
                                table: {
                                    widths: ['*'],
                                    heights: 30,
                                    body: [
                                        [notes]
                                    ]
                                }
                            },
                            {
                                style: 'header',
                                text: '\nWater\n'
                            },
                            {
                                fontSize: 6,
                                text: '\n'
                            },
                            {
                                table: {
                                    widths: ['*'],
                                    heights: 30,
                                    body: [
                                        [watertotal]
                                    ]
                                }
                            },
                            {
                                style: 'header',
                                text: '\nSolids\n'
                            },
                            {
                                fontSize: 6,
                                text: '\n'
                            },
                            {
                                table: {
                                    widths: ['*'],
                                    heights: 30,
                                    body: [
                                        [solidtotal]
                                    ]
                                }
                            },
                            {
                                style: 'header',
                                text: '\nWet Solids\n'
                            },
                            {
                                fontSize: 6,
                                text: '\n'
                            },
                            {
                                table: {
                                    widths: ['*'],
                                    heights: 30,
                                    body: [
                                        [wetsolidtotal]
                                    ]
                                }
                            },
                            {
                                alignment: 'center',
                                style: 'header',
                                text: '\nTotals\n'
                            },
                            {
                                fontSize: 6,
                                text: '\n'
                            },
                            {
                                alignment: 'center',
                                table: {
                                    widths: ['*'],
                                    heights: 30,
                                    body: [
                                        [totalwithunits]
                                    ]
                                }
                            },
                            {
                                fontSize: 6,
                                text: '\n\n\n'
                            },
                            {
                                table: {
                                    widths: [500],
                                    body: [
                                        [
                                            {
                                                fillColor: '#eeeeee',
                                                text: 'By signing below you agree that the above results are accurate and that the waste contains no hazardous materials as defined by the Resource Conservation and Recovery Act',
                                                //colSpan: 2
                                            }
                                        ],
                                        [
                                            //{text: ['DRIVER NAME: ']},
                                            {text: [dname]}
                                        ],
                                        [
                                            //{text:['DRIVER SIGNATURE: ']},
                                            {image:[dsig],
                                            width: 150}
                                        ]
                                    ]
                                }
                            }
                        ],
                        styles: {
                            header: {
                                fontSize: 14,
                                bold: true
                            },
                            bigger: {
                                fontSize: 15,
                                italics: true
                            }
                        },
                        defaultStyle: {
                            columnGap: 20
                        }

                    }

                    var pdfDoc = printer.createPdfKitDocument(docdef);
                    pdfDoc.end();

                    // here instead of writing, send pdfDoc as attachment
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'Paul.Rhett.WasteManagement@gmail.com',
                            pass: 'E+y3Cp8k'
                        }
                    });

                    var mailOptions = {
                        from: 'Paul.Rhett.WasteManagement@gmail.com',
                        to: 'gaines.p.andrew@gmail.com',
                        subject: 'Greenleaf Ticket',
                        text: 'Here is a copy of the ticket to keep for your records.',
                        attachments: {
                            filename: filename,
                            content: pdfDoc
                        }
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });

                    //pdfDoc.pipe(fs.createWriteStream(filename));
                    //pdfDoc.end();

                    client.end();
                }
            })
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
