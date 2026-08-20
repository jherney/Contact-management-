# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contact-management.e2e.spec.ts >> Contact Management E2E Tests >> should always render the dark theme
- Location: tests/contact-management.e2e.spec.ts:16:3

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     npx playwright install-deps                      ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     apt-get install libicu74\                        ║
║         libjpeg-turbo8\                              ║
║         gstreamer1.0-libav                           ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```