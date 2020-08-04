const { S3Handler } = require("../src/aws-handler");
const FileResolver = require("../src/lib/file-resolver");

describe("AWS Handler Test", () => {
  test("S3Handler can convert folder into upload params", async () => {
    // given
    const fileResolver = new FileResolver("./test/test-folder");
    const s3Handler = new S3Handler({
      region: "ap-northeast-2",
      bucket: "s3-deploy-test.oneyedev.com",
    });

    // when
    const fileNames = await fileResolver.getFileNames();
    const uploadParams = await Promise.all(
      fileNames.map((fileName) =>
        s3Handler.readFileToUpload({
          folder: fileResolver.getPathFolder(),
          fileName: fileName,
        })
      )
    );

    // then
    expect(uploadParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Bucket: "s3-deploy-test.oneyedev.com",
          ContentType: "text/plain",
          Body: expect.anything(),
          Key: "sample.txt",
        }),
        expect.objectContaining({
          Bucket: "s3-deploy-test.oneyedev.com",
          ContentType: "text/html",
          Body: expect.anything(),
          Key: "nested/sample.html",
        }),
      ])
    );
  });

  test("S3Handler can convert file into upload params", async () => {
    // given
    const fileResolver = new FileResolver("./test/sample.zip");
    const s3Handler = new S3Handler({
      region: "ap-northeast-2",
      bucket: "s3-deploy-test.oneyedev.com",
    });

    // when
    const fileNames = await fileResolver.getFileNames();
    const uploadParams = await Promise.all(
      fileNames.map((fileName) =>
        s3Handler.readFileToUpload({
          folder: fileResolver.getPathFolder(),
          fileName: fileName,
        })
      )
    );

    // then
    expect(uploadParams).toHaveLength(1);
    expect(uploadParams[0]).toEqual(
      expect.objectContaining({
        Bucket: "s3-deploy-test.oneyedev.com",
        ContentType: "application/zip",
        Body: expect.anything(),
        Key: "sample.zip",
      })
    );
  });
});
