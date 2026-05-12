import * as taskLib from 'azure-pipelines-task-lib/task';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import { ConfigIniParser } from 'config-ini-parser';
import * as fs from 'fs';

const advinstIniUrlVar: string = 'advancedinstaller.ini.url';
const defaultAdvinstIniUrl: string = 'https://www.advancedinstaller.com/downloads/updates.ini';

export class AdvinstReleases {
  private _ini: any = null;

  private async _getIni(): Promise<any> {
    if (!this._ini) {
      const content = await this._getUpdatesFileContent();
      const iniParser = new ConfigIniParser();
      this._ini = iniParser.parse(content);
    }
    return this._ini;
  }

  async getLatestVersion(): Promise<string> {
    const ini = await this._getIni();
    return ini.get(ini.sections()[0], 'ProductVersion') as string;
  }

  async getMinAllowedAdvinstVersion(): Promise<string | null> {
    const RELEASE_INTERVAL_MONTHS = 24;
    const minReleaseDate = new Date();
    minReleaseDate.setMonth(minReleaseDate.getMonth() - RELEASE_INTERVAL_MONTHS);

    const ini = await this._getIni();
    const r = ini.sections().find(s => {
      const releaseDate = ini.get(s, 'ReleaseDate');
      const [day, month, year] = releaseDate.split('/');
      return minReleaseDate > new Date(`${year}-${month}-${day}`);
    });

    if (!r) {
      return null;
    }

    return ini.get(r, 'ProductVersion') as string;
  }

  private async _getUpdatesFileContent(): Promise<string> {
    const advinstIniUrl = taskLib.getVariable(advinstIniUrlVar) || defaultAdvinstIniUrl;
    taskLib.debug('advinstIniUrl = ' + advinstIniUrl);
    const updatesFile: string = await toolLib.downloadTool(advinstIniUrl);
    return this._readTextFileWithDetectedEncoding(updatesFile);
  }

  private _readTextFileWithDetectedEncoding(filePath: string): string {
    const raw = fs.readFileSync(filePath);
    const encoding: BufferEncoding = this._hasUtf16LeBom(raw) ? 'utf16le' : 'utf8';
    return raw.toString(encoding);
  }

  private _hasUtf16LeBom(raw: Buffer): boolean {
    return raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe;
  }
}
