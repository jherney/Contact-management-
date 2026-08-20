# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contact-management.e2e.spec.ts >> Contact Management E2E Tests >> should show the unauthenticated prompt in the directory
- Location: tests/contact-management.e2e.spec.ts:38:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

╔══════════════════════════════════════════════════════════════════════════════════╗
║ Firefox is unable to launch if the $HOME folder isn't owned by the current user. ║
║ Workaround: Set the HOME=/root environment variable when running Playwright.     ║
╚══════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /root/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-366Hk9 -juggler-pipe -silent
  - <launched> pid=14702
  - [pid=14702][err] Running Nightly as root in a regular user's session is not supported.  ($XAUTHORITY is /run/user/1000/xauth_qRDcgx which is owned by jherney.)
  - [pid=14702] <process did exit: exitCode=1, signal=null>
  - [pid=14702] starting temporary directories cleanup
  - [pid=14702] <gracefully close start>
  - [pid=14702] <kill>
  - [pid=14702] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=14702] finished temporary directories cleanup
  - [pid=14702] <gracefully close end>

```