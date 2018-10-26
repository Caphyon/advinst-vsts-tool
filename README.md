# Advanced Installer Tool Installer

Acquires a specific version of Advanced Installer from internet or the tools cache and adds it to the PATH. Use this task to install Advanced Installer for subsequent tasks.

# How to use 

This installer task should be used when building a solution that contains a [Visual Studio Advanced Installer project](https://www.advancedinstaller.com/user-guide/ai-ext-vs-project.html).

* **Version** - Version that should be cached. You can find a complete list [here](https://www.advancedinstaller.com/version-history.html). If no version is specified the latest will be used. This step will be skipped if a manual installation is detected. Such may be the case in TFS environments where you may want to use a pre-configure build agent.

* **License Key** - The license id that should be used for registration. **Simple** project types don't require a license.

![Add Tool](images/tool-add.png)

![Configure Tool](images/tool-configure.png)