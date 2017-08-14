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
  let downloadUrl = 'http://www.advancedinstaller.com/downloads/advinst.msi';
  console.log('Download AdvancedInstaller version ' + version + ' from: ' + downloadUrl);
  let downloadPath: string = await toolLib.downloadTool(downloadUrl);
  if ( !taskLib.find(downloadPath) )
    throw new Error('Failed to download Advanced Installer tool.');

  //
  // Admin install to extract resources
  //
  let extPath = _getAgentTemp();
  extPath = path.join(extPath, 'advinst');
  console.log('Extract AdvancedInstaller version ' + version + ' to: ' + extPath);
  taskLib.exec('msiexec.exe', '/a \"' + downloadPath + '\" /qn TARGETDIR=' + extPath);

  let fileName = 'bin\x86';
  let toolRoot = path.join(extPath, fileName);
  if ( !taskLib.find(toolRoot) )
    throw new Error('Failed to extract Advanced Installer tool.');

  return await toolLib.cacheDir(toolRoot, 'AdvancedInstaller', version);
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