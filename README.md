# Classroom

## Overview

> **Note:** It is recommended that you fork the repository. Sometimes we keep it private.

This extension makes it easier to watch videos on N Prep!
When a video ends, it automatically moves to the next video.
You can enable or disable this extension from the right-click menu.

## Notice

This extension implements useful features that did not exist in the original extension.
Please do not contact previous developers with inquiries about this extension, as they are not involved.

<!-- This application supports full background playback by editing a flag in the internal code, but this may violate N Prep's terms of service, so please use at your own risk. -->

In no event shall the author or copyright holder be liable for any claim, damages or other obligation, whether in contract, tort or otherwise, arising out of or in connection with the Software or the use or other processing of the Software.

> **Disclaimer:** This extension is intended for study assistance only. The developer is not responsible for any abuse by users.

## Supported Browsers

> **Note:** For iOS devices, please use the Orion browser

- Chrome
- Edge
- Firefox
- Orion (Install from Google Webstore)

<!-- Tested on all browsers! Orion is complicated, so contact me (if you want to contact me on N-High School's Slack, follow this link https://n-highschool.slack.com/archives/C06T3T1E3C1) -->
## To School Officials

This application does not interfere in any way with ZEN Study's servers.

All data will be analyzed from the currently displayed web page and moved to the next video

## How to use

Install the required packages

```bash
pnpm install
```

Build the extension.

```bash
pnpm build
```

The following process is different for each browser, so please refer to the section for your browser

### Chrome

1. clone this repository
2. Open Chrome and go to `chrome://extensions/`.
3. enable developer mode
4. click `Load unpacked`.
5. select the directory where you cloned this repository.
6. go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!

### Edge

1. clone this repository.
2. open Chrome and go to `edge://extensions/`.
3. enable developer mode.
4. click `expand and load`.
5. select the directory where you cloned this repository.
6. go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!

### Firefox

1. clone this repository
2. open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. click `load temporary add-ons`
4. select `dist/firefox.zip` in the directory where you cloned this repository
5. go to `about:addons` and open the extension management.
6. enable `https://www.nnn.ed.nico access to stored data`.
7. go to [https://www.nnn.ed.nico/](https://www.nnn.ed.nico/) and enjoy!
