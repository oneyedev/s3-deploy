const AWS = require("aws-sdk");
const fs = require("fs");
const mime = require("mime");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

class UploadParam {
  constructor({ Bucket, Key, Body, ContentType }) {
    this.Bucket = Bucket;
    this.Key = Key;
    this.Body = Body;
    this.ContentType = ContentType;
  }
}

class LambdaParam {
  constructor({ s3FileKey, functionName, handler }) {
    this.s3FileKey = s3FileKey;
    this.functionName = functionName;
    this.handler = handler;
  }
}

module.exports.S3Handler = class {
  constructor({ region, bucket }) {
    this.s3 = new AWS.S3({ region });
    this.bucket = bucket;
  }

  listAllObjects() {
    return new Promise((resolve, reject) => {
      this.s3.listObjects({ Bucket: this.bucket }, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.Contents || []);
        }
      });
    });
  }

  deleteAllObjects() {
    return new Promise((resolve, reject) => {
      this.listAllObjects()
        .then((objects) => {
          if (objects.length === 0) {
            resolve();
          } else {
            const deleteParams = {
              Bucket: this.bucket,
              Delete: { Objects: objects.map((e) => ({ Key: e.Key })) },
            };
            this.s3.deleteObjects(deleteParams, function (err, data) {
              if (err) reject(err);
              else resolve(data);
            });
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  readFileToUpload({ folder, fileName }) {
    return new Promise((resolve, reject) => {
      fs.readFile(folder + fileName, (err, file) => {
        if (err) reject(err);
        else {
          resolve(
            new UploadParam({
              Bucket: this.bucket,
              Key: fileName,
              Body: file,
              ContentType: mime.getType(fileName),
            })
          );
        }
      });
    });
  }

  upload(uploadParam = UploadParam.prototype) {
    return new Promise((resolve) => {
      this.s3.upload(uploadParam, (err, data) => {
        if (err) {
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  }

  invalidateCloudfront({ distributionId }) {
    return new Promise((resolve, reject) => {
      if (!distributionId) resolve(null);
      const cloudfront = new AWS.CloudFront();
      const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: Math.floor(Date.now() / 10000).toString(),
          Paths: {
            Quantity: 1,
            Items: ["/*"],
          },
        },
      };
      cloudfront.createInvalidation(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  updateLambdaFunction(option = LambdaParam.prototype) {
    return new Promise((resolve, reject) => {
      const Lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
      if (!option.functionName) resolve(null);
      Lambda.updateFunctionCode(
        {
          FunctionName: option.functionName,
          S3Bucket: this.bucket,
          S3Key: option.s3FileKey,
        },
        function (err, data) {
          if (err) reject(error);
          else if (option.handler) {
            Lambda.updateFunctionConfiguration(
              {
                FunctionName: option.functionName,
                Handler: option.handler,
              },
              function (err, data) {
                if (err) reject(error);
                else resolve(data);
              }
            );
          } else {
            resolve(data);
          }
        }
      );
    });
  }
};
