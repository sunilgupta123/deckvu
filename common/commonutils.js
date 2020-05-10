const mongodb = require('mongodb');
const assert = require('assert');
const uri = 'mongodb://localhost:27017';
const dbName = 'collaboration';


let Duplex = require('stream').Readable;  
function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/*
const DBconnection=() => 
{
    console.log('starting DB connection')
    var db ;
    mongodb.MongoClient.connect(uri, function(error, client) {
        assert.ifError(error);
        console.log(error);
        db = client.db(dbName);
        return db;
    })
}; 

const gridfsconnection=() => 
{

}; */