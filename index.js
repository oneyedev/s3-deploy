const core = require("@actions/core");
const { S3Handler } = require("./src/aws-handler");
const FileResolver = require("./src/lib/file-resolver");
const inputs = {
  region: core.getInput("region"),
  bucket: core.getInput("bucket"),
  target: core.getInput("target"),
  distibutionId: core.getInput("distribution-id"),
  lambdaFunctionName: core.getInput("lambda-function-name"),
  lambdaFunctionHandler: core.getInput("lambda-function-name"),
};
(async () => {
  try {
    const fileResolver = new FileResolver(inputs.target);
    const fileNames = (await fileResolver.getFileNames()) || [];
    if (fileNames.length === 0) {
      console.info("No file matched");
      return;
    }
    const s3Handler = new S3Handler({
      region: inputs.region,
      bucket: inputs.bucket,
    });
    if (this.fieResolver.isDirectory) {
      await s3Handler.deleteAllObjects();
    }
    const results = await Promise.all(
      fileNames.map(async (fileName) => {
        const uploadParam = await s3Handler.readFileToUpload({
          folder: fileResolver.getPathFolder(),
          fileName: fileName,
        });
        const uploaded = await s3Handler.upload(uploadParam);
        console.log("Upload complete " + uploaded.Location);
        return uploaded;
      })
    );
    const successCount = results.filter((r) => r).length;
    const failureCount = results.length - successCount;
    console.log("Success Count : " + successCount);
    console.log("Failure Count : " + failureCount);
    const invalidation = await s3Handler.invalidateCloudfront({
      distributionId: inputs.distibutionId,
    });
    if (invalidation) {
      console.log(
        `Request invalidation successfuly at ${invalidation.Location}`
      );
    } else {
      console.log("Skip a invalidation");
    }
    const lambda = await s3Handler.updateLambdaFunction({
      s3FileKey: fileResolver.isDirectory ? "" : this.fileNames[0],
      functionName: inputs.lambdaFunctionName,
      functionHandler: inputs.lambdaFunctionHandler,
    });
    if (lambda) {
      console.log(
        `Request Lambda Deployment successfuly at ${lambda.FunctionName}`
      );
    } else {
      console.log("Skip a Lambda Deployment");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
