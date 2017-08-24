import * as toolLib from 'vsts-task-tool-lib/tool';
import * as taskLib from 'vsts-task-lib/task';
import * as taskCmd from 'vsts-task-lib/taskcommand';

import * as path from 'path';
import * as semvish from 'semvish';

let advinstToolName: string = 'advinst';
let advinstToolArch: string = 'x86';

async function run() {
  try {

    if (taskLib.osType() != 'Windows_NT')
      throw new Error('Only Windows systems are supported.');
    // Retrieve user inputs
    let version: string = taskLib.getInput('advinstVersion', true);
    let license: string = taskLib.getInput('advinstLicense', false);

    await getAdvinst(version, license);
  }
  catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message);
  }
}

async function getAdvinst(version: string, license: string): Promise<void> {

  if ( !semvish.valid(version))
    throw Error('Invalid version was specified. Version: ' + version);

  let toolPath: string;
  //Verify if this version of advinst was already installed.
  toolPath = _getLocalTool(semvish.clean(version));

  if (!toolPath) {
    console.log('Aquire a new version: ' + version);
    //Extract avinst.msi and cache the content.
    let cachedToolPath: string = await acquireAdvinst(version);
    //Compute the actual AdvancedInstaller.com folder
    toolPath = path.join(cachedToolPath, 'bin', 'x86')
    //Register advinst if a licens key was provided
    if ( license )
      await registerAdvinst(toolPath, license);
    //Add the advinst folder to PATH
    toolLib.prependPath(toolPath);
  }
  else {
    console.log('Using cached tool. Version: ' + version);
  }
}

async function registerAdvinst(toolPath: string, license: string): Promise<boolean> {
  return true;
}

async function acquireAdvinst(version: string): Promise<string> {

  let advinstDownloadPath: string = await _downloadAdvinst(version);
  if (!taskLib.exist(advinstDownloadPath)) {
    throw new Error('Failed to download tool.');
  }

  let advinstToolRoot = await _extractAdvinst(advinstDownloadPath);
  if (!taskLib.exist(advinstToolRoot)) {
    throw new Error('Failed to extract tool.');
  }
  console.log('Caching this installed tool.');
  let cachedToolPath: string = await toolLib.cacheDir(advinstToolRoot, advinstToolName, 
    semvish.clean(version), advinstToolArch);
  console.log('Successfully installed tool version ' + version);

  return cachedToolPath;
}

//
// Helper methods
//

function _getLocalTool(version: string) {
  console.log('Checking if a cached copy exists for this version...');
  return toolLib.findLocalTool(advinstToolName, version, advinstToolArch);
}

async function _downloadAdvinst(version: string): Promise<string> {
  let advinstDownloadUrl = 'http://www.advancedinstaller.com/downloads/' + version + '/advinst.msi';
  return toolLib.downloadTool(advinstDownloadUrl);
}

async function _extractAdvinst(sourceMsi: string): Promise<string> {

  let advinstWorkFolder = path.join(_getAgentTemp(), 'AdvancedInstaller');
  let msiExtractionPath: string = path.join(advinstWorkFolder, 'resources');
  // Create the work folder, otherwise msiexec will fail because of the log path.
  if (!taskLib.exist(advinstWorkFolder))
    taskLib.mkdirP(advinstWorkFolder);
  let msiLogPath: string = path.join(advinstWorkFolder, 'advinst_install.log');

  let msiexecArguments: string[] = ['/a', sourceMsi, 'TARGETDIR=' + msiExtractionPath, '/qn', '/l*v', msiLogPath];

  let exitCode = await taskLib.exec('msiexec.exe', msiexecArguments);
  taskLib.command('task.uploadfile', {}, msiLogPath);
  if (exitCode != 0) {
    taskLib.command('task.uploadfile', {}, msiLogPath);
    return '';
  }
  return msiExtractionPath;
}

function _getAgentTemp() {
  taskLib.assertAgent('2.115.0');
  let tempDirectory = taskLib.getVariable('Agent.TempDirectory');
  if (!tempDirectory) {
    throw new Error('Agent.TempDirectory is not set');
  }
  return tempDirectory;
}

run();