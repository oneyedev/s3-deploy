const core = require("@actions/core");
const main = require("./src/main");
(async () => {
  try {
    await main({
      region: core.getInput("region"),
      bucket: core.getInput("bucket"),
      target: core.getInput("target"),
      distibutionId: core.getInput("distribution-id"),
      lambdaFunctionName: core.getInput("lambda-function-name"),
      lambdaFunctionHandler: core.getInput("lambda-function-handler"),
    });
  } catch (error) {
    console.error(error);
    core.setFailed(error);
  }
})();
