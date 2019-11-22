# Hyperledger chaincode dev network

Normally chaincodes are started and maintained by peer. However in “dev
mode", chaincode is built and started by the user. This mode is useful
during chaincode development phase for rapid code/build/run/debug cycle
turnaround.

We start "dev mode" by leveraging pre-generated orderer and channel artifacts for
a sample dev network. As such, the user can immediately jump into the process
of compiling chaincode and driving calls.

## Terminal window 1 - Start the network

```bash
  docker-compose up
```

The above starts the network with the `SingleSampleMSPSolo` orderer profile and
launches the peer in "dev mode". It also launches two additional containers -
one for the chaincode environment and a CLI to interact with the chaincode. The
commands for create and join channel are embedded in the CLI container, so we
can jump immediately to the chaincode calls.

## Terminal window 2 - Build & start the chaincode

Get into bash shell in the chaincode container

```bash
docker exec -it chaincode bash
```

### Golang

Compile your chaincode

```bash
cd go-example
go build -o go-example-1
```

Run the chaincode:

```bash
CORE_PEER_ADDRESS=peer:7052 CORE_CHAINCODE_ID_NAME=mycc:v1 ./go-example-1
```

### NodeJs

Install dependencies via npm

```bash
cd js-example
npm install
```

Run the chaincode:

```bash
CORE_CHAINCODE_ID_NAME=mycc:v1 node js-example-1.js --peer.address peer:7052
CORE_CHAINCODE_ID_NAME=mycc:v1 node measurements-registry.js --peer.address peer:7052
```

In both examples you will see some 'Ready' text on last line

The chaincode is started with peer and chaincode logs indicating successful registration with the peer.
Note that at this stage the chaincode is not associated with any channel. This is done in subsequent steps
using the `instantiate` command.

## Terminal window 3 - Use the chaincode

Even though you are in `--peer-chaincodedev` mode, you still have to install the
chaincode so the life-cycle system chaincode can go through its checks normally.
This requirement may be removed in future when in `--peer-chaincodedev` mode.
We'll leverage the CLI container to drive these calls.

Get into bash shell in the chaincode container

```bash
docker exec -it cli bash
```

### Install and instantiate Golang code

```bash
peer chaincode install -p chaincodedev/chaincode/go-example -n mycc -v v1
peer chaincode instantiate -n mycc -v v1 -c '{"Args":["init","a","100","b","200"]}' -C myc
```

### Install and instantiate NodeJs code

```bash
peer chaincode install --lang node --name mycc --path /opt/gopath/src/chaincodedev/chaincode/js-example --version v1
peer chaincode instantiate --lang node -n mycc -v v1 -c '{"Args":["init","a","100","b","200"]}' -C myc

peer chaincode install --lang node --name mycc --path /opt/gopath/src/chaincodedev/chaincode/measurements-registry --version v1
peer chaincode instantiate --lang node -n mycc -v v1 -c '{"Args":["init"]}' -C myc
```

### Run functions

Lets run some functions on the chaincode/contract now.

```bash
peer chaincode invoke -n mycc -c '{"Args":["invoke","a","b","10"]}' -C myc
peer chaincode invoke -n mycc -c '{"Args":["registerParameter","ref123"]}' -C myc
peer chaincode invoke -n mycc -c '{"Args":["registerMeasurement","ref123", "100", "timestamp"]}' -C myc
```

Finally, query `a`. We should see a value of `90`.

```bash
peer chaincode query -n mycc -c '{"Args":["query","a"]}' -C myc
peer chaincode query -n mycc -c '{"Args":["queryMeasurementsByReference","ref123"]}' -C myc
```

### Retry or reset

If you want to try a contract again after code changes or reset the chain

```bash
docker-compose down
docker-compose up
```
