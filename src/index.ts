import logger from 'logger';
import browser from 'webextension-polyfill';

// Show in log when extension is loaded
logger.info('Extension loaded.');
logger.info(
  'Please star the repository if you like!\nhttps://github.com/minagishl/classroom',
);

// Flags and constants
let isEnabled = true;
let isValidPath: boolean | undefined;
let lastExecutionTime = 0;
let lastVideoPlayerTime = 0;
let lastMovingVideoTime = 0;
let previousVideoPlayer = false;
let previousBackgroundAutoPlay = false;
let videoPlayer: HTMLMediaElement | null = null;
let completed = false;
let autoPlayEnabled = true;
let backgroundAutoPlay = false;

const HIDDEN_BACKGROUND_BUTTON: boolean = false;
const RGB_COLOR_GREEN = 'rgb(0, 197, 65)';
const TYPE_MOVIE_ROUNDED_PLUS = 'movie-rounded-plus';
const REDIRECT_TIME = 3000;
const COOL_TIME = 5000;
const BUTTON_STYLE = `
  position: absolute;
  z-index: 99999;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// Initialize extension state from storage
async function updateIsEnabled(): Promise<void> {
  const data = await browser.storage.local.get([
    'enabled',
    'autoPlayEnabled',
    'backgroundAutoPlay',
  ]);
  isEnabled = data.enabled !== undefined ? data.enabled : true;
  autoPlayEnabled =
    data.autoPlayEnabled !== undefined ? data.autoPlayEnabled : true;
  backgroundAutoPlay =
    data.backgroundAutoPlay !== undefined ? data.backgroundAutoPlay : false;
  if (isEnabled) {
    await browser.storage.local.set({ enabled: true });
  }
  toggleExtension();
  updateButtons();
}

function toggleExtension(): void {
  logger.info(`Extension is ${isEnabled ? 'enabled' : 'disabled'}.`);
}

function getIsValidPath(): boolean {
  if (isValidPath === undefined) {
    const url = new URL(window.location.href);
    isValidPath = /\/courses\/\w+\/chapters\/\w+\/movie/.test(url.pathname);
  }
  return isValidPath;
}

// Create toggle buttons
function createToggleButton(
  id: string,
  text: string,
  bottom: number,
  value: boolean,
  handler: () => void,
  minWidth = 120,
  maxWidth = 200,
): void {
  const button = document.createElement('button');
  button.id = id;
  button.style.cssText = BUTTON_STYLE;
  button.style.bottom = `${bottom}px`;
  button.style.right = '40px';
  button.style.minWidth = `${minWidth}px`;
  button.style.maxWidth = `${maxWidth}px`;
  button.innerHTML = `<span style="flex-grow: 1; text-align: left;">${text}:</span><span>${value ? 'ON' : 'OFF'}</span>`;
  button.addEventListener('click', handler);
  document.body.appendChild(button);
}

async function createToggleButtons(): Promise<void> {
  createToggleButton(
    'autoPlayToggleButton',
    'Automatic',
    HIDDEN_BACKGROUND_BUTTON ? 50 : 90,
    autoPlayEnabled,
    () => {
      autoPlayEnabled = !autoPlayEnabled;
      updateButton('autoPlayToggleButton', 'Automatic', autoPlayEnabled);
      browser.storage.local.set({ autoPlayEnabled }).catch(logger.error);
    },
  );

  createToggleButton(
    'extensionToggleButton',
    'Extension',
    HIDDEN_BACKGROUND_BUTTON ? 10 : 50,
    isEnabled,
    () => {
      isEnabled = !isEnabled;
      updateButton('extensionToggleButton', 'Extension', isEnabled);
      browser.storage.local.set({ enabled: isEnabled }).catch(logger.error);
      toggleExtension();
    },
  );

  if (HIDDEN_BACKGROUND_BUTTON) {
    return;
  }

  createToggleButton(
    'backgroundAutoPlayToggleButton',
    'Background',
    10,
    backgroundAutoPlay,
    () => {
      backgroundAutoPlay = !backgroundAutoPlay;
      updateButton(
        'backgroundAutoPlayToggleButton',
        'Background',
        backgroundAutoPlay,
      );
      browser.storage.local.set({ backgroundAutoPlay }).catch(logger.error);
    },
    135,
    135,
  );
}

function updateButton(id: string, text: string, value: boolean): void {
  const button = document.getElementById(id);
  if (button !== null) {
    button.innerHTML = `<span style="flex-grow: 1; text-align: left;">${text}:</span><span>${value ? 'ON' : 'OFF'}</span>`;
  }
}

function updateButtons(): void {
  updateButton('autoPlayToggleButton', 'Automatic', autoPlayEnabled);
  updateButton('extensionToggleButton', 'Extension', isEnabled);
  updateButton(
    'backgroundAutoPlayToggleButton',
    'Background',
    backgroundAutoPlay,
  );
}

void updateIsEnabled();
void createToggleButtons();

browser.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) {
    isEnabled = changes.enabled.newValue;
    logger.info(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
    window.alert(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
    updateButtons();
  }
  if (changes.autoPlayEnabled !== undefined) {
    autoPlayEnabled = changes.autoPlayEnabled.newValue;
    updateButtons();
  }
  if (changes.backgroundAutoPlay !== undefined) {
    backgroundAutoPlay = changes.backgroundAutoPlay.newValue;
    updateButtons();
  }
});

function handleVideoEnd(): void {
  const now = Date.now();
  if (
    isEnabled &&
    now - lastExecutionTime >= COOL_TIME &&
    now - lastMovingVideoTime >= COOL_TIME // Prevent moving video too fast
  ) {
    lastExecutionTime = Date.now();
    if (document.hidden && !backgroundAutoPlay) {
      if (!previousBackgroundAutoPlay) {
        logger.info('Did not move because it was playing in the background');
      }
      previousBackgroundAutoPlay = true;
      return;
    }

    if (document.hidden && backgroundAutoPlay) {
      logger.info('Playback proceeds in the background');
    }

    previousBackgroundAutoPlay = false;
    logger.info('Video ended.');

    const list = getList();
    const index = findIndex(list);
    if (index !== -1) {
      moveElement(index + 1)
        .then(() => {
          logger.info('Moving to the next video.');
          lastMovingVideoTime = Date.now();
        })
        .catch(logger.error);
    } else if (!completed) {
      completed = true;
      window.alert('All videos have been completed.');
      logger.info('All videos have been completed.');
      logger.info(`Move to chapter after ${REDIRECT_TIME / 1000} seconds...`);

      setTimeout(() => {
        const url = new URL(window.location.href);
        const course = url.pathname.split('/')[2];
        const chapter = url.pathname.split('/')[4];
        window.location.href = `/courses/${course}/chapters/${chapter}`;
      }, REDIRECT_TIME);
    }
  }
}

let intervalId = setInterval(() => {
  if (getIsValidPath()) {
    videoPlayer = getVideoPlayer();
    if (videoPlayer !== null) {
      if (!previousVideoPlayer) logger.info('Video player found.');
      previousVideoPlayer = true;
      videoPlayer.setAttribute('playsinline', '');
      videoPlayer.setAttribute('muted', '');
      videoPlayer.setAttribute('autoplay', '');
      videoPlayer.setAttribute('controls', '');

      if (videoPlayer.ended) {
        handleVideoEnd();
      } else if (autoPlayEnabled && videoPlayer.paused) {
        videoPlayer.play().catch(logger.error);
      } else {
        videoPlayer.addEventListener('ended', handleVideoEnd);
      }
      clearInterval(intervalId); // Video player found, clear the interval
    } else if (Date.now() - lastVideoPlayerTime > COOL_TIME) {
      logger.info('Video player not found.');
      lastVideoPlayerTime = Date.now();
    }
  }
}, 500);

function getVideoPlayer(): HTMLMediaElement | null {
  try {
    if (videoPlayer === null) {
      const iframeElement = document.querySelector<HTMLIFrameElement>(
        'iframe[title="教材"]',
      );
      const iframeDocument =
        iframeElement?.contentDocument ??
        iframeElement?.contentWindow?.document;
      videoPlayer =
        iframeDocument?.querySelector<HTMLMediaElement>('video') ?? null;
    }
    return videoPlayer;
  } catch {
    return null;
  }
}

const observer = new MutationObserver(() => {
  videoPlayer = null;
  isValidPath = undefined;
  intervalId = setInterval(() => {
    // Restart the interval when DOM changes
    if (getIsValidPath()) {
      videoPlayer = getVideoPlayer();
      if (videoPlayer !== null) {
        if (!previousVideoPlayer) logger.info('Video player found.');
        previousVideoPlayer = true;

        videoPlayer.setAttribute('playsinline', '');
        videoPlayer.setAttribute('muted', '');
        videoPlayer.setAttribute('autoplay', '');
        videoPlayer.setAttribute('controls', '');

        if (videoPlayer.ended) {
          handleVideoEnd();
        } else if (autoPlayEnabled && videoPlayer.paused) {
          videoPlayer.play().catch(logger.error);
        } else {
          videoPlayer.addEventListener('ended', handleVideoEnd);
        }

        clearInterval(intervalId); // Video player found, clear the interval
      } else if (Date.now() - lastVideoPlayerTime > COOL_TIME) {
        logger.info('Video player not found.');
        lastVideoPlayerTime = Date.now();
      }
    }
  }, 500);
});

observer.observe(document.body, { childList: true, subtree: true });

interface ListItem {
  title: string;
  passed: boolean;
  type: string;
}

function findIndex(data: ListItem[]): number {
  return data.findIndex((item) => item.type === 'main' && !item.passed);
}

function getList(): ListItem[] {
  const elements = document.querySelectorAll<HTMLLIElement>(
    'ul[aria-label="必修教材リスト"] > li',
  );
  return Array.from(elements).map((element) => {
    const titleElement = element.querySelector<HTMLSpanElement>(
      'div div div span:nth-child(2)',
    );
    const title = titleElement?.textContent?.trim() ?? '';
    const iconElement = element.querySelector<HTMLElement>('div > svg');
    const iconColor = iconElement ? window.getComputedStyle(iconElement).color : '';
    const passed =
      (iconColor === RGB_COLOR_GREEN ||
        element.textContent?.includes('視聴済み')) ??
      false;
    const type =
      iconElement?.getAttribute('type') === TYPE_MOVIE_ROUNDED_PLUS
        ? 'supplement'
        : 'main';
    return { title, passed, type };
  });
}

async function moveElement(number: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const element = document.querySelector<HTMLElement>(
      `ul[aria-label="必修教材リスト"] li:nth-child(${number}) div`,
    );
    if (element === null) {
      reject(
        new Error(`Error: cannot find an element with the number ${number}`),
      );
    } else {
      element.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      resolve();
    }
  });
}
