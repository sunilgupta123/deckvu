var express = require('express');
var router = express.Router();
var usersRouter = require('../UserManager/users');
var emaillister = require('../emailreceiver/rawmails')

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

//all routing go here

router.get('/test', function (req, res) {
  res.send('Full time wasted')
})

router.get('/users/:userId/books/:bookId', function (req, res) {
  console.log(req.params)
})

router.get('/users',usersRouter.userlist);
router.post('/users',usersRouter.SaveUser);

router.get('/emails',emaillister.checkemail);

module.exports = router;
