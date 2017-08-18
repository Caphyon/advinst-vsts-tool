import * as toolLib from 'vsts-task-tool-lib/tool';
import * as taskLib from 'vsts-task-lib/task';
import * as restm from 'typed-rest-client/RestClient';

import * as os from 'os';
import * as path from 'path';

async function run() {
  try {

    if (osPlat != 'win32')
      throw new Error('Only Windows system are supported.');


    await getAdvinst('14.x', false);
  }
  catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message);
  }
}


let osPlat: string = os.platform();
let osArch: string = os.arch();

async function getAdvinst(versionSpec: string, checkLatest: boolean) {
  console.log('');
  console.log('--------------------------');
  console.log('AdvancedInstaller: ' + versionSpec);
  console.log('--------------------------');


  let toolPath = await acquireAdvinst('14.2');
  toolLib.prependPath(toolPath);
}

async function queryLatestMatch(versionSpec: string): Promise<string> {
  let versions: string[] = [];
  let version: string = toolLib.evaluateVersions(versions, versionSpec);
  return version;
}

async function acquireAdvinst(version: string): Promise<string> {
  //
  // Download - a tool installer intimately knows how to get the tool (and construct urls)
  //
  version = toolLib.cleanVersion(version);
  let downloadUrl: string = 'http://www.advancedinstaller.com/downloads/advinst.msi';
  
  let msiDownloadPath: string = await toolLib.downloadTool(downloadUrl, 'advinst.msi');
  if (!taskLib.exist(msiDownloadPath)) {
    throw new Error('Failed to download Advanced Installer tool.');
  }
  //
  // Admin install to extract resources
  //
  let advinstWorkFolder = path.join(_getAgentTemp(), 'AdvancedInstaller');
  taskLib.mkdirP(advinstWorkFolder);

  let msiLogPath: string =  path.join(advinstWorkFolder, 'advinst_install.log');
  let msiExtractionPath: string = path.join(advinstWorkFolder, 'resources');
  let msiArguments: string[] = ['/a', msiDownloadPath, 'TARGETDIR=' + msiExtractionPath, '/qn', '/l*v', msiLogPath];

  let exitCode = await taskLib.execSync('msiexec.exe', msiArguments).code;
  if (exitCode != 0) {
    throw new Error('Failed to execute msiexec.exe and extract AdvancedInstaller tool. Error: ' + exitCode);
  }
  let advinstToolRoot = path.join(msiExtractionPath, 'bin', 'x86');
  if (!taskLib.exist(advinstToolRoot)) {
    throw new Error('Failed to extract Advanced Installer tool.');
  }

  return await toolLib.cacheDir(advinstToolRoot, 'AdvancedInstaller', version);
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