pragma solidity >=0.4.25 <0.6.0;

contract Coin {

	// Contains the balance of all the accounts.
	mapping (address => uint) balances;

	address owner;

	// Signals there has been a coin transaction.
	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	// Constructor of the contract: the sender is made the owner of the coin and
	// is awarded 10.000 coins to his account.
	constructor() public {
		balances[msg.sender] = 10000;
		owner = msg.sender;
	}

	/**
	 * Sends 'amount' coins from 'sender' to 'receiver' if there is enough coins
	 * in the senders account.
	 * @param sender sender of the coins.
	 * @param receiver receiver of the coins.
	 * @param amount amount of coins sent.
	 * @return True if there is enough coins in the senders balance.
	 */
	function sendCoin(address sender, address receiver, uint amount) public returns(bool sufficient) {

		// Checks if there is enough coins in the senders balance.
		if (balances[sender] < amount) return false;

		// Takes the coins away from the senders account.
		balances[sender] -= amount;

		// Gives the coins to the senders account.
		balances[receiver] += amount;

		// Signals there has been a transaction.
		emit Transfer(sender, receiver, amount);
		return true;
	}

	/**
	 * Returns the balance of the account 'addr'.
	 * @return balance of the accounts 'addr'.
	 */
	function getBalance(address addr) public view returns(uint balance) {
		return balances[addr];
	}

	function getAccount() public view returns(address add) {
		add = msg.sender;
	}
}
