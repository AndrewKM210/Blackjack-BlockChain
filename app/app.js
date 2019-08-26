var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('..//build/contracts/Coin.json', 'utf8'));

// TODO: get contract address automatically
var cnt = new web3.eth.Contract(obj.abi, "0x860caeB3033a1B47d54e8Ef742B3D607f57730D7");

cnt.methods.getAccount().call((err, result) => {console.log(result)});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/')));

app.get('/', function (req, res) {
  res.render('index');
});

app.listen(3000, function () {
  console.log('App listening on port 3000.');
});