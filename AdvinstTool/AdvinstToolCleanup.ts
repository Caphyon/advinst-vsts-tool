import * as taskLib from 'vsts-task-lib/task';
import * as path from 'path';

async function run() {
  try {
    if (taskLib.osType() != 'Windows_NT')
      throw new Error('Only Windows systems are supported.');
    
    let licensePath = path.join(taskLib.getVariable('ProgramData'), 'Caphyon\\Advanced Installer\\license80.dat');
    if (taskLib.exist(licensePath)) {
      taskLib.rmRF(licensePath);
    }
  }
  catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message);
  }
}

run();