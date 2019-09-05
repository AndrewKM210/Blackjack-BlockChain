const numNumbers = 13;
const numSuits = 4;

class Deque {
    
    constructor() {
        const Card = require('./Card.js')
        this.cards = [];
        for (var number=0; number < numNumbers; number++) {
            for (var suit=0; suit < numSuits; suit++) {
                this.cards.push(new Card(number, suit));
            }
        }
        this.shuffle();
    }

    shuffle() {
        // Fisher-yates algorithm
        var j, x, i;
        for (i = this.cards.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = x;
        }
        return this.cards;
    }

    firstCard() {
        return this.cards.pop();
    }
}

module.exports = Deque;