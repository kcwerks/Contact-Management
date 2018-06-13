var express = require('express');
var router = express.Router();
var database = require('./database');

var geocoderProvider = 'google';
var httpAdapter = 'http';

var geocoder = require('node-geocoder')(geocoderProvider,httpAdapter);

var ObjectID = require('mongodb').ObjectID;

var workingDataSet;
var requestedSources;

/* Function used with passport logging system */
var ensureLoggedIn = function(req, res, next) 
{
	if ( req.user) 
    {
		next();
	}
	else 
    {
		res.redirect("/mailer");
	}
}

/* GET home page, renders mailer */
router.get('/', function(req, res, next) 
{
    res.render('mailer',{});
});

/* GET mailer page with form */
router.get('/mailer', function (req,res,next) 
{
    res.render('mailer', {});
});

/* POST to mailer page */
router.post('/mailer',function(req,res,next) 
{
    requestedSources = 'mailer';
    sendToDatabase(req, res);
});

/* Direct calls to the contacts page */
router.get('/contacts', ensureLoggedIn, function (req, res) 
{
    database.contacts().find().toArray(function (err, result) 
    {
        if (!err) 
        {
            
            res.render('contacts',{contacts: result});
        }
    })
});

router.get('/retContacts', ensureLoggedIn, function (req,res) 
{
    database.contacts().find().toArray(function (err, data) 
    {
        if (!err) 
        {
            res.end(JSON.stringify(data));
        }
    });
    
});

/* Returns contacts info of given ID */
router.post('/givenContact', ensureLoggedIn, function (req,res) 
{
    database.contacts().findOne({_id: ObjectID(req.body.id)}, function (err, doc) 
    {
        if (!err) 
        {   
            res.end(JSON.stringify(doc));
        }
        else 
        {
            console.log("Error while retrieving from database");
        }
    });
    
});

/* Handle submission of mailer form as SPA on /contacts */
router.post('/spaSubmit', ensureLoggedIn, function (req,res) 
{
    console.log ("Submission of data from SPA contacts form");
    requestedSources = 'create';
    sendToDatabase(req, res);
});

/* Handles click of delete button on contacts page */
router.post('/removeContact', ensureLoggedIn, function (req,res) 
{
    database.contacts().deleteOne({_id: ObjectID(req.body.id)},function (err, data) 
    {
        console.log("Delete contact engaged");
        if (!err) 
        {
            res.end(JSON.stringify({result: "deleted contact"}));
        }
        else 
        {
            console.log("error deleting contact");
        }
    });
    

});

/* Handles click of update on contacts page */
router.post('/update', ensureLoggedIn, function (req,res) 
{
    requestedSources = 'update';

    sendToDatabase(req, res);
});

/* Function to parse form and add information to database */
/* Function also geocodes address into lat/lon coords */
function sendToDatabase(req, res) 
{
    var contactByMail =false;
    var contactByPhone =false;
    var contactOnline =false;

    if (req.body.allOK != undefined) 
    {
        contactByMail = true;
        contactByPhone = true;
        contactOnline = true;
    }
    else 
    {
        if (req.body.phoneOK != undefined) 
            {
                contactByPhone = true;
            }
        if (req.body.mailOK != undefined) 
            {
                contactByMail = true;
            } 
        if (req.body.emailOK != undefined) 
            {
                contactOnline = true;
            }
    }
    /* Add parsed info to data set to be stored in database */
    workingDataSet =
    {
        suffix: req.body.suffix,
        first: req.body.first,
        last: req.body.last,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        email: req.body.email,
        phone: req.body.phone,
        contactByMail: contactByMail,
        contactByPhone: contactByPhone,
        contactByEmail: contactOnline
    };

    /* Geocoding is done server-side */
    /* Calculate latitude and longitude then add to database for specifif user */
    var latitude;
    var longitude;
    var location=req.body.street + ', '+req.body.city + ', '+req.body.state + ', '+ req.body.zip;
    
    geocoder.geocode(location, function (err, data) 
    {
        if (data[0] != null) 
        {
            workingDataSet.latitude = data[0].latitude;
            workingDataSet.longitude = data[0].longitude;
            if (requestedSources != 'update') 
            {
                database.contacts().insert(workingDataSet, function (err, data) 
                {
                    if (data.result.ok) 
                    {
                        if (requestedSources == 'mailer') 
                        {
                            res.render('mailerTY',{contact: workingDataSet});
                        }
                        else 
                        {
                            res.end(JSON.stringify(data.ops[0]));
                        }
                    }
                    else 
                    {
                       res.end(err);
                    }
                });
            }
            else 
            {
                database.contacts().updateMany({_id: ObjectID(req.body.id)}, {'$set': workingDataSet}, function (err, doc) 
                {
                    if (err) 
                    {
                        res.end(err);
                    }
                    else 
                    {
                        res.end(JSON.stringify(workingDataSet));
                    }
                });
            }
        }
        else 
        {
            console.log("Failed to geocode given location!");
        }
    });
}



module.exports = router;
