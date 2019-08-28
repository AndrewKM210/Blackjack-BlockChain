#!/bin/bash
geth --datadir chaindata --nodiscover --rpc --rpcapi 'web3, miner, personal, net, eth' --rpccorsdomain "*" --networkid 2105 --allow-insecure-unlock console
