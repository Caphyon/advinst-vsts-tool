import * as taskLib from 'azure-pipelines-task-lib/task';
import * as path from 'path';

async function run() {
  try {
    taskLib.setResourcePath(path.join(__dirname, "task.json"));
    if (taskLib.osType() != 'Windows_NT') {
      console.log(taskLib.loc("UnsupportedOS"));
      return;
    }

    const performCleanup: string = taskLib.getVariable('advinst.cleanup');
    taskLib.debug('advinst.cleanup = ' + performCleanup);
    if (!performCleanup) {
      return;
    }

    const licensePath: string = path.join(taskLib.getVariable('ProgramData'), 'Caphyon\\Advanced Installer\\license80.dat');
    if (taskLib.exist(licensePath)) {
      taskLib.rmRF(licensePath);
    }
  }
  catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message);
  }
}

run();