var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

web3.eth.defaultAccount = web3.eth.accounts[0];
web3.eth.getAccounts().then(console.log);

var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./build/contracts/Coin.json', 'utf8'));

var cnt = new web3.eth.Contract(obj.abi, "0x860caeB3033a1B47d54e8Ef742B3D607f57730D7");

console.log(cnt.options.address);

cnt.methods.getAccount().call((err, result) => {console.log(result)});


