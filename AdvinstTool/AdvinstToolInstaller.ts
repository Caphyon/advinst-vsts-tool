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
  let fileName = 'bin\x86\AdvancedInstaller.com';
  let downloadUrl = 'http://www.advancedinstaller.com/downloads/advinst.msi';

  let downloadPath: string = await toolLib.downloadTool(downloadUrl);

  //
  // Admin install to extract resources
  //
  let extPath = _getAgentTemp();
  extPath = path.join(extPath, 'advinst');
  taskLib.exec('msiexec.exe', '/a' + downloadPath + "TARGETDIR=" + extPath);

  let toolRoot = path.join(extPath, fileName);
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