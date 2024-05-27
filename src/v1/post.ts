import * as taskLib from 'azure-pipelines-task-lib/task';
import * as path from 'path';

async function run() {
  try {
    taskLib.setResourcePath(path.join(__dirname, "task.json"));
    if (taskLib.getPlatform() != taskLib.Platform.Windows) {
      console.log(taskLib.loc("UnsupportedOS"));
      return;
    }

    // Skip cleanup if the advancedinstaller.cleanup is set to false. We need to skip
    // license file deletion when several tasks run in paralel
    let performCleanup: string = taskLib.getVariable('advancedinstaller.cleanup');
    if (performCleanup && performCleanup.toLowerCase() == 'false') {
      console.log(taskLib.loc("CleanupDisabled", performCleanup));
      return;
    }

    performCleanup = taskLib.getVariable('advinst.cleanup');
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
