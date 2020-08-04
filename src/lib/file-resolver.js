const glob = require("@actions/glob");
const nodePath = require("path");
const fs = require("fs");

module.exports = class FileResolver {
  constructor(path = "./") {
    this.path = path;
    this.target = nodePath.resolve(process.cwd(), this.path);
    this.isDirectory = fs.lstatSync(this.target).isDirectory();
  }

  async getFileNames() {
    if (this.isDirectory) {
      const pattern = `${this.path}/**/*.*`;
      const option = { followSymbolicLinks: false };
      const globber = await glob.create(pattern, option);
      const files = await globber.glob();
      return files.map((name) => name.replace(this.getPathFolder(), ""));
    } else {
      return [nodePath.basename(this.target)];
    }
  }

  getPathFolder() {
    return this.isDirectory
      ? this.target + "/"
      : nodePath.resolve(this.target, "../") + "/";
  }
};
