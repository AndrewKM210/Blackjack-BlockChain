var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('..//build/contracts/Coin.json', 'utf8'));

const contract_dir = "0x860caeB3033a1B47d54e8Ef742B3D607f57730D7";
console.log("Contract address: " + contract_dir);

// TODO: get contract address automatically
var contract = new web3.eth.Contract(obj.abi, contract_dir);

web3.eth.getAccounts().then(function(accounts) {
  web3.eth.defaultAccount = accounts[0];
  console.log("Default account address: " + accounts[0]);
});

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/')));

app.get('/', function (req, res) {
  res.render('index', {
    contract_address: contract_dir,
    default_account: web3.eth.defaultAccount
  });
});

app.listen(3000, function () {
  console.log('App listening on port 3000.');
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  account = req.body.account;
  password = req.body.password;
  console.log('Unlocking account ' + account + '...');
  if (web3.utils.isAddress(account)) {
    web3.eth.personal.unlockAccount(account, password, 0).then(function(ok, error) {
      if (error != null) {
        console.log('Error unlocking account: ' + error);
      } else {
        console.log('Account ' + account + ' unlocked!');
        res.render('game');
      }
    });
  } else {
    console.log('Error: account is not a valid ethereum address')
    res.render('login', {
      error: 'Account is not a valid ethereum address'
    })
  }
});