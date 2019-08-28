pragma solidity >=0.4.25 <0.6.0;

contract ERC20Interface {

    function totalSupply() public view returns (uint);

    function balanceOf(address tokenOwner) public view returns (uint balance);

    function allowance(address tokenOwner, address spender) public view returns (uint remaining);

    function transfer(address to, uint tokens) public returns (bool success);

    function approve(address spender, uint tokens) public returns (bool success);

    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);

    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

}

contract Coin is ERC20Interface {

	// Contains the balance of all the accounts.
	mapping (address => uint) balances;

	address owner;

	string public constant name = "CustomCoin";

    string public constant symbol = "CC";

    uint8 public constant decimals = 2;

	// Signals there has been a coin transaction.
	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

	// Constructor of the contract: the sender is made the owner of the coin and
	// is awarded 10.000 coins to his account.
	constructor() public {
		balances[msg.sender] = 10000;
		owner = msg.sender;
	}

	/**
	 * Sends 'tokens' coins from 'sender' to 'receiver' if there is enough coins
	 * in the senders account.
	 * @param from sender of the coins.
	 * @param to receiver of the coins.
	 * @param tokens amount of coins sent.
	 * @return True if there is enough coins in the senders balance.
	 */
	function transferFrom(address from, address to, uint tokens) public returns(bool sufficient) {

		// Checks if there is enough coins in the senders balance.
		if (balances[from] < tokens) return false;

		// Takes the coins away from the senders account.
		balances[from] -= tokens;

		// Gives the coins to the senders account.
		balances[to] += tokens;

		// Signals there has been a transaction.
		emit Transfer(from, to, tokens);
		return true;
	}

	/**
	 * Returns the balance of the account 'addr'.
	 * @return balance of the accounts 'addr'.
	 */
	function balanceOf(address addr) public view returns(uint balance) {
		return balances[addr];
	}

	function getAccount() public view returns(address add) {
		add = msg.sender;
	}

	function totalSupply() public view returns (uint) {
		return 0;
	}

	function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
		return 10000;
	}

    function transfer(address to, uint tokens) public returns (bool success) {

		// Checks if there is enough coins in the senders balance.
		if (balances[msg.sender] < tokens) return false;

		// Takes the coins away from the senders account.
		balances[msg.sender] -= tokens;

		// Gives the coins to the senders account.
		balances[to] += tokens;

		// Signals there has been a transaction.
		emit Transfer(msg.sender, to, tokens);
		return true;
	}

	function approve(address spender, uint tokens) public returns (bool success) {
		return true;
	}

}
