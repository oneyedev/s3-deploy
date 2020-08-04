const { S3Handler } = require("./aws-handler");
const FileResolver = require("./lib/file-resolver");

class DeployOption {
  constructor() {
    this.region = "";
    this.bucket = "";
    this.target = "";
    this.distibutionId = "";
    this.lambdaFunctionName = "";
    this.lambdaFunctionHandler = "";
  }
}

module.exports = async (option = DeployOption.prototype) => {
  const fileResolver = new FileResolver(option.target);
  const fileNames = (await fileResolver.getFileNames()) || [];
  if (fileNames.length === 0) {
    console.info("No file matched");
    return;
  }
  const s3Handler = new S3Handler({
    region: option.region,
    bucket: option.bucket,
  });
  if (fileResolver.isDirectory) {
    await s3Handler.deleteAllObjects();
  }
  const results = await Promise.all(
    fileNames.map(async (fileName) => {
      const uploadParam = await s3Handler.readFileToUpload({
        folder: fileResolver.getPathFolder(),
        fileName: fileName,
      });
      const uploaded = await s3Handler.upload(uploadParam);
      if (uploaded) {
        console.log("Upload complete " + uploaded.Location);
      } else {
        console.log("Upload failed " + fileResolver.getPathFolder() + fileName);
      }
      return uploaded;
    })
  );
  const successCount = results.filter((r) => r).length;
  const failureCount = results.length - successCount;
  console.log("Success Count : " + successCount);
  console.log("Failure Count : " + failureCount);
  const invalidation = await s3Handler.invalidateCloudfront({
    distributionId: option.distibutionId,
  });
  if (invalidation) {
    console.log(`Request invalidation successfuly at ${invalidation.Location}`);
  } else {
    console.log("Skip a invalidation");
  }
  const lambda = await s3Handler.updateLambdaFunction({
    s3FileKey: fileResolver.isDirectory ? "" : fileNames[0],
    functionName: option.lambdaFunctionName,
    functionHandler: option.lambdaFunctionHandler,
  });
  if (lambda) {
    console.log(
      `Request Lambda Deployment successfuly at ${lambda.FunctionName}`
    );
  } else {
    console.log("Skip a Lambda Deployment");
  }
};
