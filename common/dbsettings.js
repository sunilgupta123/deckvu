const assert = require("assert");
const mongoclient = require("mongodb").MongoClient;
//const config = require("../config");
//const mongo = require('mongodb');
const uri = 'mongodb://localhost:27017';
const dbName = 'collaboration';

// for monk 
const connectionString='localhost:27017/collaboration';
//plan to replace monk in long term
const monk = require('monk');
let _monkdb;


let _db;

function monkdb(){
    _monkdb = monk(connectionString);
    return _monkdb
}

function initDb(callback) {
    mongoclient.connect(uri, function(error, client) {
        assert.ifError(error);
      
        _db = client.db(dbName);
        
        console.log("DB initialized - connected to: " + connectionString);
        
        callback(null, _db);
    });

    /* if (_db) {
        console.warn("Trying to init DB again!");
        return callback(null, _db);
    }
    //client.connect(config.db.connectionString, config.db.connectionOptions, connected);
    mongoclient.connect(uri,connected);

function connected(err, db) {
        if (err) {
            console.log(err);
            callback(err, null);
        }
        _db = mongoclient.db(dbName);

        console.log("DB initialized - connected to: " + connectionString);
        
        callback(null, _db);
} */
}

function getDb() {
    //assert.ok(_db, "Db has not been initialized. Please called init first.");
    if (_db==null){
        console.log('initialisig DB');
        initDb(function(err,dbconection){
            if(err){
                console.log("DB initialization error" + err);
            }
            _db = dbconection;
            //set it in respective methods  
            //_db.collection('messages');   
            return _db        
        });
    }
    else{
        console.log('returning DB');
        return _db;
    }
    
}

module.exports = {
    getDb,
    monkdb
};