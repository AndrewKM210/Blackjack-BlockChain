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
          cards: undefined,
          deal: true,
          userTurn: false,
          stayed: false,
          botStayed: false,
          message: 'Start by pressing the deal button'
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
        cards: undefined,
        deal: true,
        userTurn: false
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
    cards: undefined,
    deal: true,
    userTurn: false
  });
})

app.post('/deal', function(req, res) {
  var deque = new Deque();
  var firstCards = [deque.firstCard()];
  var firstCardsBot = [deque.firstCard()];
  firstCards.push(deque.firstCard());
  firstCardsBot.push(deque.firstCard());
  req.session.deque = deque;
  req.session.cards = firstCards;
  req.session.botCards = firstCardsBot;
  req.session.score = firstCards[0].number + firstCards[1].number;
  req.session.botScore = firstCardsBot[0].number + firstCardsBot[1].number;
  req.session.stayed = false;
  req.session.botStayed = false;
  res.render('game', {
    cards: firstCards,
    deal: false,
    userTurn: true,
    stayed: false,
    botStayed: false,
    message: 'Dealt the cards, you start.'
  })
})

app.post('/play', function(req, res) {
  var deque = Object.assign(new Deque, req.session.deque);
  var card = deque.firstCard();
  req.session.cards.push(card);
  req.session.score += card.number;
  if (req.session.score <= 21) {
    if (req.session.botStayed) {
      res.render('game', {
        cards: req.session.cards,
        deal: false,
        userTurn: true,
        message: 'You have chosen to play, your turn.',
      });
    } else {
      res.render('game', {
        cards: req.session.cards,
        deal: false,
        userTurn: false,
        message: 'You have chosen to play, bot\'s turn.',
      });
    }
  } else {
    console.log('User has surpassed 21 points');
    res.render('game', {
      cards: undefined,
      deal: true,
      userTurn: false,
      message: 'You have exceeded 21 points, bot wins.',
    })
  }
})

app.post('/goLogin', function(req, res) {
  res.redirect('login');
})

app.post('/goRegister', function(req, res) {
  res.redirect('register');
})

app.post('/botTurn', function(req, res) {
  if (req.session.botScore < 17) {
    var deque = Object.assign(new Deque(), req.session.queue);
    var newCard = deque.firstCard();
    req.session.botScore += newCard.number;
    req.session.botCards.push(newCard);
    if (req.session.botScore <= 21) {
      if (!req.session.stayed) {
        res.render('game', {
          cards: req.session.cards,
          deal: false,
          userTurn: true,
          message: 'Bot has chosen to play, your turn.',
        });
      } else {
        res.render('game', {
          cards: req.session.cards,
          deal: false,
          userTurn: false,
          message: 'Bot has chosen to play, bot\'s turn.',
        })
      }
    } else {
      res.render('game', {
        cards: req.session.cards,
        deal: true,
        userTurn: false,
        message: 'Bot has exceeded 21 points, you win.',
      })
    }
  } else {
    req.session.botStayed = true;
    var message;
    if (req.session.stayed) {
      message = 'You have both chosen to stay. Your score: ' + req.session.score + '   Bot score: ' + req.session.botScore;
      if (req.session.score > req.session.botScore) {
        message += '. You win!';
      } else if (req.session.score < req.session.botScore) {
        message += '. You loose!';
      } else {
        message += '. It\'s a draw!';
      }
      res.render('game', {
        cards: req.session.cards,
        deal: true,
        userTurn: false,
        message: message,
      });
    } else {
      message = 'Bot has chosen to stay, your turn.';
      res.render('game', {
        cards: req.session.cards,
        deal: false,
        userTurn: true,
        message: message,
      })
    }
  }
})

app.post('/stay', function(req, res) {
  req.session.stayed = true;
  var message;
  if (req.session.botStayed) {
    message = 'You have both chosen to stay. Your score: ' + req.session.score + '   Bot score: ' + req.session.botScore;
    if (req.session.score > req.session.botScore) {
      message += '. You win!';
    } else if (req.session.score < req.session.botScore) {
      message += '. You loose!';
    } else {
      message += '. It\'s a draw!';
    }
    res.render('game', {
      cards: req.session.cards,
      deal: true,
      userTurn: false,
      message: message,
    });
  } else {
    message = 'You have chosen to stay, bot\'s turn.'
    res.render('game', {
      cards: req.session.cards,
      deal: false,
      userTurn: false,
      message: message,
    });
  }
});