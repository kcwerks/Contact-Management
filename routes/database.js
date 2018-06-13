/* Setup all database connections for the app */

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require ('mongodb').ObjectID;
var url = 'mongodb://kcalabro:Kyle1727@ds133428.mlab.com:33428/webapps';

var contacts;
var contactList; //array of existing contacts retrieved from database

MongoClient.connect(url, function(err, db) 
{
    console.log("Successfully connected to the database");
    if (err) 
    {
        console.log("Cound not connect to the database");
    }
    contacts = db.collection('contacts');
});
                    
exports.contacts = function() 
{
    return contacts;
};

exports.getUserName = function () 
{
    return username;
}

exports.getPassword = function() 
{
    return password;
}
