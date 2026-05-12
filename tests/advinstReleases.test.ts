import { AdvinstReleases } from '../src/v1/advinstReleases';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as taskLib from 'azure-pipelines-task-lib/task';
import * as fs from 'fs';

jest.mock('azure-pipelines-tool-lib/tool');
jest.mock('azure-pipelines-task-lib/task');

const mockedToolLib = jest.mocked(toolLib);
const mockedTaskLib = jest.mocked(taskLib);

const FAKE_INI_PATH = '/tmp/updates.ini';
const DEFAULT_INI_URL = 'https://www.advancedinstaller.com/downloads/updates.ini';

// Sections ordered newest first. Fixed "now" = 2025-01-01, so 24 months ago = 2023-01-01.
// v24 (2024-06-15) is within 24 months; v22 (2022-06-15) is older → min allowed version.
const sampleIni = `
[v24]
ProductVersion=24.9
ReleaseDate=15/06/2024

[v22]
ProductVersion=22.0
ReleaseDate=15/06/2022
`;

// All sections within 24 months → getMinAllowedAdvinstVersion should return null.
const recentOnlyIni = `
[v24b]
ProductVersion=24.9
ReleaseDate=15/06/2024

[v24a]
ProductVersion=24.0
ReleaseDate=15/01/2024
`;

describe('AdvinstReleases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
    jest.clearAllMocks();
    mockedTaskLib.getVariable.mockReturnValue(null);
    mockedTaskLib.debug.mockImplementation(() => {});
    mockedToolLib.downloadTool.mockResolvedValue(FAKE_INI_PATH);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(sampleIni));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('getLatestVersion', () => {
    it('returns the ProductVersion from the first INI section', async () => {
      const releases = new AdvinstReleases();
      expect(await releases.getLatestVersion()).toBe('24.9');
    });
  });

  describe('getMinAllowedAdvinstVersion', () => {
    it('returns the first version whose release date is older than 24 months', async () => {
      const releases = new AdvinstReleases();
      expect(await releases.getMinAllowedAdvinstVersion()).toBe('22.0');
    });

    it('returns null when all versions are within the 24-month window', async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(recentOnlyIni));
      const releases = new AdvinstReleases();
      expect(await releases.getMinAllowedAdvinstVersion()).toBeNull();
    });
  });

  describe('INI caching', () => {
    it('downloads the INI file only once even when both methods are called', async () => {
      const releases = new AdvinstReleases();
      await releases.getLatestVersion();
      await releases.getMinAllowedAdvinstVersion();
      expect(mockedToolLib.downloadTool).toHaveBeenCalledTimes(1);
    });
  });

  describe('INI URL', () => {
    it('uses the default URL when no pipeline variable is set', async () => {
      const releases = new AdvinstReleases();
      await releases.getLatestVersion();
      expect(mockedToolLib.downloadTool).toHaveBeenCalledWith(DEFAULT_INI_URL);
    });

    it('uses the custom URL from the pipeline variable when set', async () => {
      const customUrl = 'https://example.com/custom-updates.ini';
      mockedTaskLib.getVariable.mockReturnValue(customUrl);
      const releases = new AdvinstReleases();
      await releases.getLatestVersion();
      expect(mockedToolLib.downloadTool).toHaveBeenCalledWith(customUrl);
    });
  });

  describe('encoding detection', () => {
    it('reads a UTF-16 LE file (with BOM) correctly', async () => {
      const bom = Buffer.from([0xff, 0xfe]);
      const content = Buffer.from(sampleIni, 'utf16le');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.concat([bom, content]));
      const releases = new AdvinstReleases();
      expect(await releases.getLatestVersion()).toBe('24.9');
    });

    it('reads a plain UTF-8 file correctly', async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(sampleIni, 'utf8'));
      const releases = new AdvinstReleases();
      expect(await releases.getLatestVersion()).toBe('24.9');
    });
  });
});
