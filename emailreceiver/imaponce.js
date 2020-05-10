const MailReceive = require('mail-receive');
const mongodb = require('mongodb');
const assert = require('assert');
const commonutility = require('../common/commonutils');
const monkdb = require('../common/dbsettings').monkdb;
const getDb = require('../common/dbsettings').getDb;
var md5 = require('md5');

let Duplex = require('stream').Readable;  
function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const getready=(req,callback)=>{
    var imapsettings;
    const db= monkdb();

    if(req.query.userId==null){
      console.log("email id is required : " + req.query.userId);
      callback('email id is required',null);
      return;  
    }

    console.log('checking for email : ' + req.query.userId);
  
    //db = req.db;
    //db=monkdb();

    var userinfo;
    var Usercollection = db.get('userlist');
    Usercollection.findOne({email:req.query.userId},{},function(e,doc){
      //res.json(docs);
      //console.log('email details retrieved : ' + doc.pwd);
      userinfo=doc;
      console.log('user data : ' + JSON.stringify(userinfo, null, 2));
    }).then((doc) =>{

    //console.log('inside then');

    imapsettings = {
    user: req.query.userId, //"deckvu1@yahoo.com",
    password: doc.pwd, //"Hello@123",
    host: "imap.mail.yahoo.com",
    port: 993,
    markSeen: false, // temporary for testing purpose
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
        }
    };
    console.log(imapsettings);
    //console.log('giving the control back')
    callback(null,imapsettings);

}).catch(function(err)
    {
    console.log('some problem in getready function');
    callback(err,null)
    }
    );
    
};

function mailcheck(req)
{ 
    //db = req.db;
    //db=monkdb();
    
    //var collection = db.get('rawmessage');

    getready(req,function(err,imap){
        if(err)
        {
            console.log('full tension : imap property could not be populated');
            return;            
        };
    const n = MailReceive(imap);
 
    n.on('end', () => console.log(`${imap.user} offline`))
    .on('mail', function(mail){
        
       SaveMessages(req,mail,function(err,mailexists,mailinfo,AttchedFiles){
           console.log('output of SaveMessage, Mail Exists : ' + mailexists);
           if(err) throw err;
           if(mailexists==false)
                {
                    handleattchments(mailinfo,AttchedFiles);
                }
            });
        } 
          
        )
    .on('connected', () => {
            console.log(` ${imap.user} logged`)
        })
    .on('error', err => {
            console.log(err)
        })
    .start()

   })
};

function handleattchments(mailinfo,AttchedFiles){

    for (i = 0, len = AttchedFiles.length; i < len; i++) { 
        saveattachment(mailinfo,AttchedFiles[i],function(err,maildata,attachedFileInfo){
            if(err){
                console.log('save attachemnt failed : ' + err);
                throw err;
            }
            else{
                SaveMessageFileInfo(maildata,attachedFileInfo);
            }
        })
    };
};

function saveattachment(maildata,attachment,callback)
{   
    //saves file on gridFS also updates access control for the file
    console.log('save attachment starts');  
    const db2= getDb();
    
    var bucket = new mongodb.GridFSBucket(db2);
        
    //for (i = 0, len = AttchedFiles.length; i < len; i++) { 
    var contentmd5;
    var fileoptions;
    var filesharedwith=[];
    filesharedwith = maildata.from.value.concat(maildata.to.value);
    if(maildata.cc){
        filesharedwith=filesharedwith.concat(maildata.cc.value);
    }

    contentmd5=md5(attachment.content);
    checkfile(attachment.filename,contentmd5,function(err,fileexist,existinfileinfo){
        if (err) throw err;

        if (fileexist==false){
            fileoptions = {
            metadata:{
            contentType: attachment.contentType, 
            version: "1",
            owner: maildata.from.value[0],
            sharedwith: filesharedwith}}

            bufferToStream(attachment.content).
            pipe(bucket.openUploadStream(attachment.filename,fileoptions)). 
    
            on('error', function(error) {
                assert.ifError(error);
            }).
            on('finish', function(fileinfo) {
                console.log('done with file -' + JSON.stringify(fileinfo, null, 2));
                callback(null,maildata,fileinfo);
            });
        }
        else{
            //need to update sharing info for existing files
            //To be developed
            callback(null,maildata,existinfileinfo);
        }
    })
        
    //}

    //console.log('saved attachments : ' + AttchedFiles.length);
};

function checkfile(newfilename,contentmd5,callback){
    const db= getDb();
    var dbc;

    dbc= db.collection('fs.files');
    
    dbc.findOne({filename:newfilename, md5: contentmd5}).then((result) => {
        //if (err) throw err; // good way to handle error in parent functions
        if (result==null) 
            {console.log('no match found based on name & md5');
            callback(null,false,null) } //file doesnt exist in system
        else 
            {callback(null,true,result);} //file exists and fileinfo returned
    }).catch(function(err)
        {
        console.log('problem in checkfile' + err);
        callback(err,null,null)
        }
    );
};

function SaveMessageFileInfo(mail,fileinfo,callback)
{
    //db=monkdb();
    //const db= monkdb();
    const db= getDb();
    var dbc;

    //console.log('Update starts for fileinfo : ' + JSON.stringify(fileinfo));
    //db2 = db.db('collaboration');
    dbc= db.collection('messages');
    //dbc.findOne({messageId: mail.messageId}).then((finaldoc) => {
        
    //dbc.updateOne({_id: finaldoc._id}, {attachments: fileinfo}).then((updatedDoc) => {
    dbc.updateOne({messageId: mail.messageId}, {$push : {attachments: fileinfo}}).then((updatedDoc) => {
        //callback(null,updatedDoc);
        console.log('saved file info : ' + JSON.stringify(updatedDoc,null,2));
    }).catch(function(err)
        {
            console.log('problem in SaveMessageFileInfo :' + err);
            //callback(err,null);
        });
   // });
};

function SaveMessages(req,mail,callback){
    //var dbcon;

    var finalmessage;
    var AttchedFiles=[];
    //db=req.db;
    const db= monkdb();

    finalmessage= db.get('messages');
    console.log('check for : ' + mail.subject);

    finalmessage.findOne({messageId: mail.messageId}).then((finaldoc) => {
    //finalmessage.find({messageId: mail.messageId}).then((finaldoc) => {           
        if(finaldoc==null)
        {   
            console.log('new message : ' + mail.subject);
            AttchedFiles=mail.attachments;
            mail.attachments=[];    
            finalmessage.insert(mail, function(err, result){
                console.log((err === null) ? { msg: 'processed : ' + mail.messageId } : { msg: err });
                callback(null,false,mail,AttchedFiles);
            });   
        }    
        else
        {
            console.log('match found for : ' + finaldoc.subject);
            callback(null,true,finaldoc,AttchedFiles)
            //console.log('match found on ID: ' + sourcedoc.messageId + ' = ' + finaldoc.messageId);
        }
    }).catch(function(err)
        {
        console.log('problem in savemessage' + err);
        callback(err,null,null,null)
        }
    )
};

module.exports = {
    mailcheck:mailcheck
  };