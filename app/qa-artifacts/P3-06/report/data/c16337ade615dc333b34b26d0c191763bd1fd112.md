# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/form.spec.ts >> E-01 @smoke form structure and validation >> empty submit shows every error, focuses the first field and sends no analyze request
- Location: tests/e2e/form.spec.ts:85:7

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     sudo npx playwright install-deps                 ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     sudo apt-get install libevent-2.1-7t64\          ║
║         libflite1\                                   ║
║         libavif16\                                   ║
║         libmanette-0.2-0                             ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```