var debug = require('debug');
var path = require('path');

var root = module.parent;
while (root.parent) root = root.parent;
var rootDir = path.dirname(path.dirname( path.normalize(root.filename) ));

module.exports = makeLogger;

function makeLogger(module) {
  var filename = module.filename.slice(rootDir.length+1).split('/').join(':').replace(/\.[^.]+$/, '');
  var d = debug(filename);
  d.filename = filename;
  return d;
}
