const shim = require("fabric-shim");

var Chaincode = class {
  async Init(stub) {
    console.info("measurementRegistry::init");
    return shim.success();
  }

  async Invoke(stub) {
    console.info("measurementRegistry::transactionId " + stub.getTxID());

    let ret = stub.getFunctionAndParameters();
    let method = this[ret.fcn];

    if (!method) {
      console.error(
        "measurementregistry::no function of name:" + ret.fcn + " found"
      );
      throw new Error("Received unknown function " + ret.fcn + " invocation");
    }

    try {
      console.info("measurementRegistry::invokes " + ret.fcn, ret.params);
      const response = await method(stub, ret.params, this);
      console.info("measurementRegistry::" + ret.fcn + " success", ret.params);
      return shim.success(response);
    } catch (err) {
      console.error(err);
      return shim.error(err);
    }
  }

  async registerParameter(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error("Incorrect number of arguments, expecting 1");
    }

    const parameterReference = args[0].toString();

    console.info(
      "measurementRegistry::registerParameter::try with parameterReference " +
        parameterReference
    );

    await stub.putState(
      parameterReference,
      Buffer.from(
        JSON.stringify({
          reference: parameterReference,
          docType: "parameter"
        })
      )
    );

    return Buffer.from("success");
  }

  async registerMeasurement(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error("Incorrect number of arguments, expecting 3");
    }

    const parameterReference = args[0].toString();

    console.info(
      "measurementRegistry::registerMeasurement::try for parameterReference " +
        parameterReference,
      args
    );

    await stub.putState(
      parameterReference,
      Buffer.from(
        JSON.stringify({
          reference: parameterReference,
          docType: "measurement",
          value: args[2],
          timestamp: args[3]
        })
      )
    );

    return Buffer.from("success");
  }

  async queryMeasurementsByReference(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error("Incorrect number of arguments, expecting 1");
    }

    const query = {
      selector: {
        docType: "measurement",
        reference: args[0].toString()
      }
    };

    let iterator = await stub.getQueryResult(JSON.stringify(query));

    let method = thisClass["parseResults"];
    let parseResults = await method(iterator);

    return Buffer.from(JSON.stringify(parseResults));
  }

  async parseResults(iterator) {
    const rows = [];

    while (true) {
      const result = await iterator.next();

      if (result.value && result.value.value.toString()) {
        const key = result.value.key;
        let row;
        try {
          row = JSON.parse(result.value.value.toString("utf8"));
        } catch (err) {
          row = result.value.value.toString("utf8");
        }

        rows.push({ key, row });
      }

      if (result.done) {
        await iterator.close();
        return rows;
      }
    }
  }
};

shim.start(new Chaincode());
