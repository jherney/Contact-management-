# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contact-management.e2e.spec.ts >> Contact Management E2E Tests >> should display a Sign In button when unauthenticated
- Location: tests/contact-management.e2e.spec.ts:30:3

# Error details

```
Error: browserType.launch: Failed to launch the browser process.
Browser logs:

╔══════════════════════════════════════════════════════════════════════════════════╗
║ Firefox is unable to launch if the $HOME folder isn't owned by the current user. ║
║ Workaround: Set the HOME=/root environment variable when running Playwright.     ║
╚══════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /root/.cache/ms-playwright/firefox-1538/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-SLznaB -juggler-pipe -silent
  - <launched> pid=14667
  - [pid=14667][err] Running Nightly as root in a regular user's session is not supported.  ($XAUTHORITY is /run/user/1000/xauth_qRDcgx which is owned by jherney.)
  - [pid=14667] <process did exit: exitCode=1, signal=null>
  - [pid=14667] starting temporary directories cleanup
  - [pid=14667] <gracefully close start>
  - [pid=14667] <kill>
  - [pid=14667] <skipped force kill spawnedProcess.killed=false processClosed=true>
  - [pid=14667] finished temporary directories cleanup
  - [pid=14667] <gracefully close end>

```