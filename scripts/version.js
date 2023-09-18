var path = require('path');
var fs = require('fs');
var eol = require('eol');
let semvish = require('semvish');
var semver = require('semver');

function run() {
  try {
    if (process.argv.length !== 3) {
      console.error('Invalid command was specified. E.g. npm run version:set 1.2.3');
      return;
    }

    let version = semvish.clean(process.argv[2]);
    if (!semvish.valid(version, null)) {
      console.error('Invalid version was specified. E.g. npm run version:set 1.2.3');
      return;
    }
    updateVsixManifest(version);
    updateTask(version);
  } catch (error) {
    console.error(error);
  }
}

function updateVsixManifest(version) {
  const vsixManifest = path.join(__dirname, '..', 'vss-extension.json');
  const fileContent = fs.readFileSync(vsixManifest, 'utf-8');

  var json = JSON.parse(fileContent);
  json.version = version;
  fs.writeFileSync(vsixManifest, eol.crlf(JSON.stringify(json, null, 2)), 'utf-8');
}

function updateTask(version) {
  const taskFile = path.join(__dirname, '..', 'tool', 'task.json');
  const fileContent = fs.readFileSync(taskFile, 'utf-8');
  var json = JSON.parse(fileContent);
  json.version.Major = semver.major(version);
  json.version.Minor = semver.minor(version);
  json.version.Patch = semver.patch(version);
  fs.writeFileSync(taskFile, eol.crlf(JSON.stringify(json, null, 2)), 'utf-8');
}

run() 