import * as taskLib from 'vsts-task-lib/task';
import * as toolLib from 'vsts-task-tool-lib/tool';
import * as taskCmd from 'vsts-task-lib/taskcommand';

import * as path from 'path';
import * as semvish from 'semvish';

const advinstToolId: string = 'advinst';
const advinstToolArch: string = 'x86';
const advinstToolSubPath: string = 'bin\\x86';
const advinstToolExecutable: string = 'AdvancedInstaller.com';
const advinstMSBuildTargetsVar: string = 'AdvancedInstallerMSBuildTargets';
const advinstToolRootVar: string = 'AdvancedInstallerRoot';
const advinstMSBuildTargetsSubPath: string = 'ProgramFilesFolder\\MSBuild\\Caphyon\\Advanced Installer';
const advinstDownloadUrlVar: string = 'advancedinstaller.url';

async function run() {
  try {
    taskLib.setResourcePath(path.join(__dirname, "task.json"));

    if (taskLib.osType() != 'Windows_NT')
      throw new Error(taskLib.loc("UnsupportedOS"));
    // Retrieve user inputs
    let version: string = taskLib.getInput('advinstVersion', true);
    let license: string = taskLib.getInput('advinstLicense', true);
    await getAdvinst(version, license);
  }
  catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message);
  }
}

async function getAdvinst(version: string, license: string): Promise<void> {

  if (!semvish.valid(version))
    throw Error(taskLib.loc("InvalidVersionFormat", version));

  let toolPath: string;
  //Verify if this version of advinst was already installed.
  toolPath = _getLocalTool(semvish.clean(version));

  if (!toolPath) {
    console.log(taskLib.loc("InstallNewTool"));
    //Extract advinst.msi and cache the content.
    let cachedToolRoot: string = await acquireAdvinst(version);
    //Compute the actual AdvancedInstaller.com folder
    toolPath = path.join(cachedToolRoot, advinstToolSubPath);
    //Register advinst if a license key was provided
    await registerAdvinst(toolPath, license);
    //Add the advinst folder to PATH
    toolLib.prependPath(toolPath);

    //Set the environment variables that will be used by Advanced Installer tasks later on.
    let msBuildTargetsPath: string = path.join(cachedToolRoot, advinstMSBuildTargetsSubPath);
    taskLib.setVariable(advinstMSBuildTargetsVar, msBuildTargetsPath);
    taskLib.setVariable(advinstToolRootVar, cachedToolRoot);
  }
  else {
    console.log(taskLib.loc("UseCachedTool", toolPath));
  }
}

async function registerAdvinst(toolRoot: string, license: string): Promise<void> {
  console.log(taskLib.loc("RegisterTool"))
  let execResult = taskLib.execSync(path.join(toolRoot, advinstToolExecutable), ['/register', license]);
  if (execResult.code != 0) {
    throw new Error(taskLib.loc("RegisterToolFailed", execResult.stdout));
  }
  let licensePath = path.join(taskLib.getVariable('ProgramData'), 'Caphyon\\Advanced Installer\\license80.dat');
  taskLib.checkPath(licensePath, taskLib.loc("AdvinstLicenseFile"));
}

async function acquireAdvinst(version: string): Promise<string> {

  let advinstDownloadPath: string = await _downloadAdvinst(version);
  if (!taskLib.exist(advinstDownloadPath)) {
    throw new Error(taskLib.loc("DownloadToolFailed"));
  }

  let advinstToolRoot = await _extractAdvinst(advinstDownloadPath);
  if (!taskLib.exist(advinstToolRoot)) {
    throw new Error(taskLib.loc("ExtractToolFailed"));
  }

  console.log(taskLib.loc("CacheTool"));
  let cachedToolPath: string = await toolLib.cacheDir(advinstToolRoot, advinstToolId,
    semvish.clean(version), advinstToolArch);
  console.log(taskLib.loc("CacheToolSuccess", version));

  return cachedToolPath;
}

//
// Helper methods
//
function _getLocalTool(version: string) {
  console.log(taskLib.loc("CheckToolCache"));
  return toolLib.findLocalTool(advinstToolId, version, advinstToolArch);
}

async function _downloadAdvinst(version: string): Promise<string> {
  let advinstDownloadUrl : string = taskLib.getVariable(advinstDownloadUrlVar);
  if (!advinstDownloadUrl)
    advinstDownloadUrl = 'http://www.advancedinstaller.com/downloads/' + version + '/advinst.msi';

  console.log(taskLib.loc("DownloadTool", advinstDownloadUrl));
  return toolLib.downloadTool(advinstDownloadUrl);
}

async function _extractAdvinst(sourceMsi: string): Promise<string> {
  console.log(taskLib.loc("ExtractTool"));

  let advinstWorkFolder = path.join(_getAgentTemp(), 'AdvancedInstaller');
  let msiExtractionPath: string = path.join(advinstWorkFolder, 'resources');
  // Create the work folder, otherwise msiexec will fail because of the log path.
  if (!taskLib.exist(advinstWorkFolder))
    taskLib.mkdirP(advinstWorkFolder);
  let msiLogPath: string = path.join(advinstWorkFolder, 'advinst_install.log');

  let msiexecArguments: string[] = ['/a', sourceMsi, 'TARGETDIR=' + msiExtractionPath, '/qn', '/l*v', msiLogPath];

  let exitCode = taskLib.execSync('msiexec.exe', msiexecArguments).code;
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
    throw new Error(taskLib.loc("AgentTempDirAssert"));
  }
  return tempDirectory;
}

run();