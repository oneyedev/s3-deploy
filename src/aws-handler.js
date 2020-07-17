const AWS = require("aws-sdk");
const fs = require("fs");
const mime = require("mime");

class UploadParam {
  constructor({ Bucket, Key, Body, ContentType }) {
    this.Bucket = Bucket;
    this.Key = Key;
    this.Body = Body;
    this.ContentType = ContentType;
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
      this.listAllObjects().then((objects) => {
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
      var params = {
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: Math.floor(Date.now() / 10000).toString(),
          Paths: {
            Quantity: 1,
            Items: ["/*"],
          },
        },
      };
      CloudFront.createInvalidation(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
};

// module.exports.uploadFiles = ({ root = "", fileNames, bucket }) => {
//   return new Promise((resolve, reject) => {
//     if (!fileNames || !fileNames.length > 0) {
//       reject("No matched files");
//     }
//     const lastIndex = fileNames.length - 1;
//     fileNames.forEach((fileName, index) => {
//       convertToUploadParam({
//         root,
//         fileName,
//         bucket,
//       }).then((uploadParam) => {
//         console.log(uploadParam);
//       });
//       //   s3.upload(option, (err, data) => {
//       //     if (err) reject(err);
//       //     else {
//       //       console.log("Upload complete " + data.Location);
//       //       if (index === lastIndex) {
//       //         resolve();
//       //       }
//       //     }
//       //   });
//     });
//   });
// };

// module.exports.deleteAllObjects = deleteAllObjects;
