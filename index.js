const core = require('@actions/core');
const github = require('@actions/github');
const inputs = {
  region: core.getInput('region'),
  bucket: core.getInput('bucket'),
  distibutionId: core.getInput('distribution-id')
}

try {
  console.dir(inputs)
} catch (error) {
  core.setFailed(error.message);
}