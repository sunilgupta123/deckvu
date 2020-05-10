/*
checks all messages received and de-dups it
saves files in GridFS
maintains msg threads
*/
//var multer = require('multer');
//var GridFsStorage = require('multer-gridfs-storage');
//var Grid = require('gridfs-stream');

var rawmessage;     // msg to be processed
var finalmessage; // De-duplicated msg
var db;         // DB object
var MailFiles; // for handling attachments
//var Grid = require('mongodb').Grid;
//var MongoClient = require('mongodb').MongoClient
const mongodb = require('mongodb');
const assert = require('assert');
const fs = require('fs');
//var stream = require('stream');
//var mongoose = require('mongoose');

var db2;
let Duplex = require('stream').Readable;  
function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function ProcessMessages(req){
    db=req.db;
    rawmessage= db.get('rawmessage');
    finalmessage= db.get('messages');
    rawmessage.findOneAndDelete({}).then((sourcedoc) => {
        finalmessage.findOne({messageId: sourcedoc.messageId}).then((finaldoc) => {
           
           if(finaldoc==null)
           {
            console.log('no match for : ' + sourcedoc.subject);

                    if(sourcedoc.attachments==null){
                        console.log('no attachments');
                    }
                    else{
                        if (sourcedoc.attachments.length>0){
                            MailFiles=sourcedoc.attachments;
                            console.log('file attachments : ' + MailFiles[0].filename);
                            sourcedoc.attachments=null;
                            saveattachment(MailFiles);
                        }
                        else
                        {
                            console.log('no file attachments');  
                        };
                    };
        
                    finalmessage.insert(sourcedoc, function(err, result){
                        console.log(
                        (err === null) ? { msg: 'processed : ' + JSON.stringify(result,null,2) } : { msg: err }
                            );
                        });   
                } 
           else
           {
            console.log('match found : ' + sourcedoc.subject + ' = ' + finaldoc.subject);
            //console.log('match found on ID: ' + sourcedoc.messageId + ' = ' + finaldoc.messageId);
           }
        }).catch(function(err)
        {
        console.log('problem in finalmessage' + err);
        }
        )

    }).catch(function(err)
        {
        console.log('problem in rawmessage : ' + err);
        }
    )
};


function testconcept(req)
{
    sharedwithconcept(req);
};

function sharedwithconcept(req)
{
    var filesharedwith=[];
    db=req.db;
    finalmessage= db.get('messages');
    finalmessage.findOne({subject: 'Fw: 2 attachment test'}).then((sourcedoc) => {
        // finalmessage.findOne({messageId: sourcedoc.messageId}).then((finaldoc) => {           
        console.log('working on : ' + sourcedoc.subject);
  /*      
        filesharedwith.push(sourcedoc.from.value[0].address); //owner is always access to file
        filesharedwith.push(sourcedoc.to.value[0].address); //receivers can be multiple
        filesharedwith.push(sourcedoc.cc.value[0].address); //receivers can be multiple
*/
        filesharedwith = sourcedoc.from.value.concat(sourcedoc.to.value);
        if(sourcedoc.cc){
            filesharedwith=filesharedwith.concat(sourcedoc.cc.value);
        }
        //console.log('from : ' + JSON.stringify(sourcedoc.from,null,2));
        console.log('filesharedwith at' + JSON.stringify(filesharedwith,null,2));
                
     }).catch(function(err)
         {
         console.log('problem in concept : ' + err);
         res.send('problem in concept : ' + err);
         }
     )    
};

function saveattachment(attachments)
{   
  console.log('save starts');  
    //Grid = mongo.Grid;
    //Grid = db.Grid;
    const uri = 'mongodb://localhost:27017';
    const dbName = 'collaboration';

    const buf1 = Buffer.from(attachments[0].content);
    console.log('check buffer : ' + Buffer.isBuffer(attachments[0].content));
    console.log('check type : ' + typeof attachments[0].content);
    console.log('check content len : ' +   buf1.length);
    console.log('check content len again : ' +   Buffer.byteLength(attachments[0].content));
    

     //working for direct access from file
    mongodb.MongoClient.connect(uri, function(error, client) {
        assert.ifError(error);
      
        db2 = client.db(dbName);
      
        var bucket = new mongodb.GridFSBucket(db2);
     //   const buf1 = Buffer.from(attachments[0].content);
       // console.log('assigning content : ' +  buf1.byteLength)
                    //bucket.openUploadStream(buf1);
 
    
        //fs.createReadStream('./README.md').
        bufferToStream(attachments[0].content).
            pipe(bucket.openUploadStream(attachments[0].filename)). 
            //attachments[0].filename)).
            on('error', function(error) {
                assert.ifError(error);
            }).
            on('finish', function() {
                console.log('done!');
                //process.exit(0);
            });
        });


    
    console.log('saved attachment : ' + attachments[0].filename);
    
    //callback(null,attachments);
};

function checkattachment(req)
{
    db=req.db;
    rawmessage= db.get('rawmessage');
    
    
 
 //   mongoose.connect('mongodb://localhost:27017/collaboration');

  
    //finalmessage= db.get('messages');
    rawmessage.findOne({subject: 'grid fs storage try'}).then((sourcedoc) => {
       // finalmessage.findOne({messageId: sourcedoc.messageId}).then((finaldoc) => {           
            console.log('working on : ' + sourcedoc.subject);

                    if(sourcedoc.attachments==null){
                        console.log('no attachments');
                    }
                    else{
                        if (sourcedoc.attachments.length>0){
                            MailFiles=sourcedoc.attachments;
                            console.log('file attachments : ' + MailFiles[0].filename);
                            sourcedoc.attachments=null;
                            saveattachment(MailFiles);
                        }
                        else
                        {
                            console.log('no file attachments');  
                        };
                    };
    }).catch(function(err)
        {
        console.log('problem in rawmessage : ' + err);
        }
    )
};

function savefileon(req){
    var sourcefile, destfile;
    sourcefile=req.query.source;
    destfile=req.query.dest;

    console.log('source : ' + sourcefile + ' - Dest : ' + destfile);   
    
    const uri = 'mongodb://localhost:27017';
    const dbName = 'collaboration';

    mongodb.MongoClient.connect(uri, function(error, client) {
        assert.ifError(error);
      
        db3 = client.db(dbName);

    const bucket = new mongodb.GridFSBucket(db3, {
        chunkSizeBytes: 1024
        //,bucketName: 'songs'
      });
      
      bucket.openDownloadStreamByName(sourcefile).
        pipe(fs.createWriteStream(destfile)).
        on('error', function(error) {
          assert.ifError(error);
        }).
        on('finish', function() {
          console.log('done!');
          process.exit(0);
        });
    })
    };

module.exports = {
    ProcessMessages:ProcessMessages,    
    checkattachment:checkattachment,
    savefileon:savefileon,
    testconcept:testconcept
  };