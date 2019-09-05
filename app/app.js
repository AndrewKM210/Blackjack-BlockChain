const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const Web3 = require('web3');
const Deque = require('./classes/Deque.js');
const redis = require('redis');
const redisStore = require('connect-redis')(session);

const client  = redis.createClient();

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

app.use(session({
  secret: 'f8o1nH2Fd24',

  store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
  saveUninitialized: false,
  resave: false
}));


app.get('/', function(req, res) {
  req.session.hola = 'Hola!';
  res.render('index', {
    contract_address: contract_dir,
    default_account: web3.eth.defaultAccount
  });
});

app.listen(3000, function() {
  console.log('App listening on port 3000.');
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  account = req.body.account;
  password = req.body.password;
  console.log('\n\nUNLOCKING ACCOUNT ' + account);
  if (web3.utils.isAddress(account)) {
    web3.eth.personal.unlockAccount(account, password, 0).then(function(ok, error) {
      if (error != null) {
        console.log('Error unlocking account: ' + error);
      } else {
        console.log('Account ' + account + ' unlocked!');
        req.session.account = account;
        res.render('game', {
          deque: undefined,
          cards: undefined
        });
      }
    });
  } else {
    console.log('Error: account is not a valid ethereum address')
    res.render('login', {
      error: 'Account is not a valid ethereum address'
    });
  }
});

app.get('/register', function(req, res) {
  res.render('register');
})

app.post('/register', function(req, res) {
  console.log('\n\nCREATING NEW ACCOUNT');
  password = req.body.password;
  console.log('Checking passwords...');
  if (password == req.body.password2) {
    web3.eth.personal.newAccount(password).then(function(newAccount) {
      console.log('Account created: ' + newAccount);
      req.session.account = newAccount;
      res.render('game', {
        deque: undefined,
        cards: undefined
      })
    })
  } else {
    console.log('Error: the passwords are not the same');
    res.render('register', {
      error: 'The passwords are not the same'
    });
  }
})

app.get('/game', function(req, res) {
  res.render('game', {
    deque: undefined,
    cards: undefined
  });
})

app.post('/deal', function(req, res) {
  var deque = new Deque();
  var firstCards = [deque.firstCard(), deque.firstCard()];
  req.session.deque = deque;
  req.session.cards = firstCards;
  req.session.score = firstCards[0].number + firstCards[1].number;
  res.render('game', {
    deque: deque,
    cards: firstCards
  })
})

app.post('/another', function(req, res) {
  var deque = Object.assign(new Deque, req.session.deque);
  var card = deque.firstCard();
  req.session.cards.push(card);
  if (req.session.score + card.number <= 21) {
    console.log('User is still in game');
    req.session.score += card.number;
    res.render('game', {
      deque: req.session.deque,
      cards: req.session.cards,
    });
  } else {
    console.log('User has surpassed 21 points');
    res.render('game', {
      deque: undefined,
      cards: undefined
    })
  }
})

app.post('/goLogin', function(req, res) {
  res.redirect('login');
})

app.post('/goRegister', function(req, res) {
  res.redirect('register');
})
