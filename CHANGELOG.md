# ChangeLog

Changelog of Advanced Installer Tool Installer task.

### Advanced Installer Tool Installer 1.0.0

* First official release.

### Advanced Installer Tool Installer 1.0.1

* Fixed spelling mistakes and updated help.

### Advanced Installer Tool Installer 1.0.2

Improvements
* Prepare environment for building Advanced Installer Visual Studio projects (AIPROJ).
* Added support for specifying a custom download URL for Advanced Installer through a build variable.
* Enable extension for TFS as tool installers are supported starting with TFS 2018.

Bugs:
* Removed mandatory flag for license field. Simple projects don't need a license.

### Advanced Installer Tool Installer 1.0.3

* Cosmetic changes to Marketplace page.

### Advanced Installer Tool Installer 1.0.4

Bugs:
* Advanced Installer was not found by subsequent tasks when reused from tools cache.

### Advanced Installer Tool Installer 1.0.5

Bugs:
* Use HTTPS for Advanced Installer download URL.

### Advanced Installer Tool Installer 1.0.6

Bugs:
* Possible fix for "The Temp folder is on a drive that is full or is inaccessible.
Free up space on the drive or verify that you have write permission on the Temp folder." error that
manifests on some hosted machines.

### Advanced Installer Tool Installer 1.0.7

Improvements:
* Added specific license registration support ( requires [Advanced Installer 14.6](https://www.advancedinstaller.com/version-history.html) )

### Advanced Installer Tool Installer 1.1.0

Improvements:
* If no version is specified, use latest
* Removed preview flag

Bugs:
* Better execution guard for task cleanup.

### Advanced Installer Tool Installer 1.2.0

Improvements:
* Enable PowerShell automation

### Advanced Installer Tool Installer 1.2.1

Bugs:
* Skip PowerShell automation for older Advanced Installer versions

### Advanced Installer Tool Installer 1.2.2

Bugs:
* *Postjobexecution* script will *not fail* on an unsupported agent OS

### Advanced Installer Tool Installer 1.2.3

Bugs:
* Pipeline hangs when the Advanced Installer extraction folder contains spaces

### Advanced Installer Tool Installer 1.2.4

Improvements:
* Disable task cleanup by setting variable _**advancedinstaller.cleanup = false**_

### Advanced Installer Tool Installer 1.2.5

Improvements:
* Migrate task to Node10 to avoid deprecation warning. Details [here](https://github.com/microsoft/azure-pipelines-tasks/blob/master/docs/migrateNode10.md).

### Advanced Installer Tool Installer 1.2.6

* Added deprecation warning for versions of Advanced Installer that are more than two years old. Please check the [release history](https://www.advancedinstaller.com/version-history.html) to pick a compatible version.

### Advanced Installer Tool Installer 1.2.6

* Added deprecation warning for versions of Advanced Installer that are more than two years old. Please check the [release history](https://www.advancedinstaller.com/version-history.html) to pick a compatible version.
