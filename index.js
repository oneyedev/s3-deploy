const core = require("@actions/core");
const { S3Handler } = require("./src/aws-handler");
const FileResolver = require("./src/lib/file-resolver");
const inputs = {
  publicRoot: core.getInput("public-root"),
  region: core.getInput("region"),
  bucket: core.getInput("bucket"),
  distibutionId: core.getInput("distribution-id"),
};
(async () => {
  try {
    const fileResolver = new FileResolver(inputs.publicRoot);
    const fileNames = (await fileResolver.getFileNames()) || [];
    if (fileNames.length === 0) {
      console.info("No file matched");
      return;
    }
    const s3Handler = new S3Handler({
      region: inputs.region,
      bucket: inputs.bucket,
    });
    await s3Handler.deleteAllObjects();
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
      console.log("Skip invalidation");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
