const glob = require("@actions/glob");
const path = require("path");

module.exports = class FileResolver {
  constructor(path = "./") {
    this.path = path;
  }

  async getFileNames() {
    const pattern = `${this.path}/**/*.*`;
    const option = { followSymbolicLinks: false };
    const globber = await glob.create(pattern, option);
    const files = await globber.glob();
    return files.map((name) => name.replace(this.getPathFolder(), ""));
  }

  getPathFolder() {
    return `${path.resolve(process.cwd(), this.path)}/`;
  }
};
