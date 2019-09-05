// Import modules
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const Web3 = require('web3');
const Deque = require('./classes/Deque.js');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const contract = require('@truffle/contract');

// Set the provider as the geth host
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// Load the compiled Coin.json file
var fs = require('fs');
var conn = require('../build/contracts/Coin.json');

// Create the contract object with the json loaded json file
const myContract = contract(conn);
var coinContract;
myContract.setProvider(web3.currentProvider);
myContract.deployed().then(function(instance) {
  coinContract = instance;
  console.log('Contract address: ' + coinContract.address);
});

// Create express app
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/')));

// Create redis cliente, to store sessions
const client  = redis.createClient();
app.use(session({
  secret: 'f8o1nH2Fd24',
  store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
  saveUninitialized: false,
  resave: false
}));

/**
 * Leaves the app listening on port 3000.
 */
app.listen(3000, function() {
  console.log('App listening on port 3000.');
});

/**
 * Renders the index page.
 */
app.get('/', function(req, res) {
  res.render('index', {
    contract_address: coinContract.address  
  });
});

/**  
 * Called when clicking the login button of the index page. Redirects to the
 * login page
 */
app.post('/goLogin', function(req, res) {
  res.redirect('login');
})

/**  
 * Called when clicking the register button of the index page. Redirects to the
 * register page
 */
app.post('/goRegister', function(req, res) {
  res.redirect('register');
})

/**
 * Renders the login page.
 */
app.get('/login', function (req, res) {
  res.render('login', {
    message: null
  });
});

/**
 * Called when clicking the login button. Checks that the address is valid and
 * then tries to unlock the account. If succesful, it will render the game page.
 * If not, it will return an error message.
 */
app.post('/login', function(req, res) {
  
  // Obtain account and password from form body.
  account = req.body.account;
  password = req.body.password;
  console.log('\n\nUNLOCKING ACCOUNT ' + account);

  // Check if the address is valid
  if (web3.utils.isAddress(account)) {

    // Try to unlock account
      web3.eth.personal.unlockAccount(account, password, 0).then(function() {

        // Render the game page
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
      }).catch(function(error) {

        // If an error is caught, return an error message
        console.log('Error unlocking account: ' + error);
        res.render('login', {
          message: "Password is incorrect."
        });
      });
  } else {

    // If the account is not valid, return an error message
    console.log('Error: account is not a valid ethereum address')
    res.render('login', {
      message: 'Account is not a valid ethereum address.'
    });
  }
});

/**
 * Renders the register page.
 */
app.get('/register', function(req, res) {
  res.render('register');
})

/**
 * Called when the register button is clicked. It checks if both passwords
 * typed in the form coincide. If they do, it creates a new account. If not, 
 * shows an error message.
 */
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
    console.log('Error: the passwords don\'t coincide');
    res.render('register', {
      message: 'The passwords don\'t coincide,'
    });
  }
})

/**
 * Renders the game page.
 */
app.get('/game', function(req, res) {
  res.render('game', {
    cards: undefined,
    deal: true,
    userTurn: false,
    message: null
  });
})

/**
 * Called when the deal button is clicked, at the start of a new game. It 
 * creates a shuffled pack deque of cards, and gives two to the user and two to
 * the bot. It saves all the objects (user cards, bot cards, deque and scores)
 * in the session variable.
 */
app.post('/deal', function(req, res) {

  // Create new shuffled deque of cards
  var deque = new Deque();

  // Give 2 cards to user and another 2 to the bot
  var firstCards = [deque.firstCard()];
  var firstCardsBot = [deque.firstCard()];
  firstCards.push(deque.firstCard());
  firstCardsBot.push(deque.firstCard());

  // Save values in session
  req.session.deque = deque;
  req.session.cards = firstCards;
  req.session.botCards = firstCardsBot;
  req.session.score = firstCards[0].number + firstCards[1].number;
  req.session.botScore = firstCardsBot[0].number + firstCardsBot[1].number;
  req.session.stayed = false;
  req.session.botStayed = false;

  // Render the game page again.
  res.render('game', {
    cards: firstCards,
    deal: false,
    userTurn: true,
    message: 'Dealt the cards, you start.'
  })
})

/**
 * Called when the play button is clicked. Gets the first card from the deque.
 * If the value of the card in addition to the current score is lower or equal
 * to 21, then it renders the page again. If not, it ends the game.
 */
app.post('/play', function(req, res) {

  // Recuperate deque from session
  var deque = Object.assign(new Deque, req.session.deque);

  // Get the first card
  var card = deque.firstCard();
  req.session.cards.push(card);

  // Calculate new score
  req.session.score += card.number;

  if (req.session.score <= 21) {

    // If the new score is under or equal 21 and the bot stayed last turn, it's
    // still the user's turn
    if (req.session.botStayed) {
      res.render('game', {
        cards: req.session.cards,
        deal: false,
        userTurn: true,
        message: 'You have chosen to play, your turn.',
      });

    // If the bot didn't stay, it's the bot's turn
    } else {
      res.render('game', {
        cards: req.session.cards,
        deal: false,
        userTurn: false,
        message: 'You have chosen to play, bot\'s turn.',
      });
    }
  } else {
    // If the new score is over 21, the user has lost. It finishes the game, 
    // showing the scores.
    console.log('User has surpassed 21 points');
    res.render('game', {
      cards: undefined,
      deal: true,
      userTurn: false,
      message: 'You have exceeded 21 points, bot wins.',
    })
  }
})

/**
 * Called when clicking the stay button. The player doesn't lift a new card and
 * stops playing until the bot decides to stay. If the bot has already decided
 * to stay, the game ends.
 */
app.post('/stay', function(req, res) {
  req.session.stayed = true;
  var message;

  // If bot has stayed, the game finishes.
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

  // If bot hasn't finished, then the user has to wait until bot has finished.
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

/**
 * Called when the Bot turn button is clicked. It simulates a players turn. If
 * his score is under 17, it plays in a similar way to the user. If not, it 
 * stays.
 */
app.post('/botTurn', function(req, res) {

  // If its score is under 17
  if (req.session.botScore < 17) {

    // Recuperates the deque from the session variable
    var deque = Object.assign(new Deque(), req.session.queue);

    // Obtains the first card from the deque
    var newCard = deque.firstCard();
    req.session.botCards.push(newCard);

    // Calculates the new score
    req.session.botScore += newCard.number;
  
    // If the score is under or equal to 21
    if (req.session.botScore <= 21) {

      // If the user hasn't stayed, it's the user's turn
      if (!req.session.stayed) {
        res.render('game', {
          cards: req.session.cards,
          deal: false,
          userTurn: true,
          message: 'Bot has chosen to play, your turn.',
        });
      
      // If the user has stayed, it's the bot's turn again
      } else {
        res.render('game', {
          cards: req.session.cards,
          deal: false,
          userTurn: false,
          message: 'Bot has chosen to play, bot\'s turn.',
        })
      }
    // If the score is over 21, the bot has lost.
    } else {
      res.render('game', {
        cards: req.session.cards,
        deal: true,
        userTurn: false,
        message: 'Bot has exceeded 21 points, you win.',
      })
    }

  // If the score is over 17, the bot stays
  } else {
    req.session.botStayed = true;
    var message;

    // If the user has stayed then the game has finished
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

    // If the user hasn't stayed, the bot has to wait until the user has 
    // finished.
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
