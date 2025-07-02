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
let returnToChapter = true;
let hideUI = false;
let userInteracted = false;

const HIDDEN_BACKGROUND_BUTTON: boolean = false;
const RGB_COLOR_GREEN = 'rgb(0, 197, 65)';
const TYPE_MOVIE_ROUNDED_PLUS = 'movie-rounded-plus';
const REDIRECT_TIME = 3000;
const COOL_TIME = 5000;
const BUTTON_STYLE = `
  position: fixed;
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
    'returnToChapter',
    'hideUI',
  ]);
  isEnabled =
    data.enabled !== undefined && typeof data.enabled === 'boolean'
      ? data.enabled
      : true;
  autoPlayEnabled =
    data.autoPlayEnabled !== undefined &&
    typeof data.autoPlayEnabled === 'boolean'
      ? data.autoPlayEnabled
      : true;
  backgroundAutoPlay =
    data.backgroundAutoPlay !== undefined &&
    typeof data.backgroundAutoPlay === 'boolean'
      ? data.backgroundAutoPlay
      : false;
  returnToChapter =
    data.returnToChapter !== undefined &&
    typeof data.returnToChapter === 'boolean'
      ? data.returnToChapter
      : true;
  hideUI =
    data.hideUI !== undefined && typeof data.hideUI === 'boolean'
      ? data.hideUI
      : false;
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
  if (hideUI) return;
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

void (async () => {
  await updateIsEnabled();
  await createToggleButtons();
})().catch(logger.error);

browser.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) {
    isEnabled =
      typeof changes.enabled.newValue === 'boolean'
        ? changes.enabled.newValue
        : isEnabled;
    logger.info(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
    window.alert(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
    updateButtons();
  }
  if (changes.autoPlayEnabled !== undefined) {
    autoPlayEnabled =
      typeof changes.autoPlayEnabled.newValue === 'boolean'
        ? changes.autoPlayEnabled.newValue
        : autoPlayEnabled;
    updateButtons();
  }
  if (changes.backgroundAutoPlay !== undefined) {
    backgroundAutoPlay =
      typeof changes.backgroundAutoPlay.newValue === 'boolean'
        ? changes.backgroundAutoPlay.newValue
        : backgroundAutoPlay;
    updateButtons();
  }
  if (changes.returnToChapter !== undefined) {
    returnToChapter =
      typeof changes.returnToChapter.newValue === 'boolean'
        ? changes.returnToChapter.newValue
        : returnToChapter;
    window.alert(
      `Return to chapter is now ${returnToChapter ? 'enabled' : 'disabled'}`,
    );
  }
  if (changes.hideUI !== undefined) {
    hideUI =
      typeof changes.hideUI.newValue === 'boolean'
        ? changes.hideUI.newValue
        : hideUI;
    window.alert(`UI buttons are now ${hideUI ? 'hidden' : 'visible'}`);

    // Remove existing buttons if UI is hidden
    if (hideUI) {
      for (const id of [
        'autoPlayToggleButton',
        'extensionToggleButton',
        'backgroundAutoPlayToggleButton',
      ]) {
        const button = document.getElementById(id);
        if (button) button.remove();
      }
    } else {
      // Recreate buttons if UI is shown
      void createToggleButtons();
    }
  }
});

function createPlayButton(video: HTMLMediaElement): void {
  if (hideUI) return;

  const existingButton = document.getElementById('videoPlayButton');
  if (existingButton) return;

  const button = document.createElement('button');
  button.id = 'videoPlayButton';
  button.style.cssText = BUTTON_STYLE;
  button.style.bottom = '130px';
  button.style.right = '40px';
  button.innerHTML = '<span>Play Video</span>';

  button.addEventListener('click', () => {
    userInteracted = true;
    video.play().catch(logger.error);
    button.remove();
  });

  document.body.appendChild(button);
}

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

      if (returnToChapter) {
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

      if (!previousVideoPlayer) {
        logger.info('Video player found.');
        createPlayButton(videoPlayer);
      }

      if (videoPlayer.ended) {
        handleVideoEnd();
      } else if (userInteracted && autoPlayEnabled && videoPlayer.paused) {
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
        if (!previousVideoPlayer) {
          logger.info('Video player found.');
          createPlayButton(videoPlayer);
        }
        previousVideoPlayer = true;

        videoPlayer.setAttribute('playsinline', '');
        videoPlayer.setAttribute('muted', '');
        videoPlayer.setAttribute('autoplay', '');
        videoPlayer.setAttribute('controls', '');

        if (videoPlayer.ended) {
          handleVideoEnd();
        } else if (userInteracted && autoPlayEnabled && videoPlayer.paused) {
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
  let elements: NodeListOf<HTMLLIElement>;

  elements = document.querySelectorAll<HTMLLIElement>(
    'ul[aria-label="必修教材リスト"] > li',
  );

  if (elements.length === 0) {
    elements = document.querySelectorAll<HTMLLIElement>(
      'ul[aria-label="課外教材リスト"] > li',
    );

    if (elements.length === 0) {
      logger.error('No elements found.');
      return [];
    }
  }

  return Array.from(elements).map((element) => {
    const titleElement = element.querySelector<HTMLSpanElement>(
      'div div div span:nth-child(2)',
    );
    const title = titleElement?.textContent?.trim() ?? '';
    const iconElement = element.querySelector<HTMLElement>('div > svg');
    const iconColor = iconElement
      ? window.getComputedStyle(iconElement).color
      : '';
    const passed =
      (iconColor === RGB_COLOR_GREEN ||
        element.textContent?.includes('視聴済み') ||
        element.textContent?.includes('理解した')) ??
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
    let element: HTMLElement | null = null;

    element = document.querySelector<HTMLElement>(
      `ul[aria-label="必修教材リスト"] li:nth-child(${number}) div`,
    );

    if (element === null) {
      element = document.querySelector<HTMLElement>(
        `ul[aria-label="課外教材リスト"] li:nth-child(${number}) div`,
      );
    }

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

// HTML to Markdown conversion function
function htmlToMarkdown(html: string): string {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Helper function to process nodes recursively
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Skip elements with class="indicators"
      if (element.classList.contains('indicators')) {
        return '';
      }

      const tagName = element.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(processNode).join('');

      switch (tagName) {
        case 'h1':
          return `# ${children}\n\n`;
        case 'h2':
          return `## ${children}\n\n`;
        case 'h3':
          return `### ${children}\n\n`;
        case 'h4':
          return `#### ${children}\n\n`;
        case 'h5':
          return `##### ${children}\n\n`;
        case 'h6':
          return `###### ${children}\n\n`;
        case 'p':
          return `${children}\n\n`;
        case 'br':
          return '\n';
        case 'strong':
        case 'b':
          return `**${children}**`;
        case 'em':
        case 'i':
          return `*${children}*`;
        case 'code':
          return `\`${children}\``;
        case 'pre':
          return `\`\`\`\n${children}\n\`\`\`\n\n`;
        case 'ul':
          return `${children}\n`;
        case 'ol':
          return `${children}\n`;
        case 'li':
          return `- ${children}\n`;
        case 'a': {
          const href = element.getAttribute('href');
          return href ? `[${children}](${href})` : children;
        }
        case 'img': {
          const src = element.getAttribute('src');
          const alt = element.getAttribute('alt') || '';
          return src ? `![${alt}](${src})` : alt;
        }
        case 'blockquote':
          return `> ${children}\n\n`;
        case 'hr':
          return '---\n\n';
        case 'div':
        case 'span':
          return children;
        default:
          return children;
      }
    }

    return '';
  }

  return processNode(tempDiv).trim();
}

// Function to find and extract exercise content from teaching materials iframe
function getExerciseContent(): string | null {
  try {
    // First try to find exercises in the main document
    let exerciseElements = document.querySelectorAll('.exercise');

    // If not found, search within the teaching materials iframe
    if (exerciseElements.length === 0) {
      const iframeElement = document.querySelector<HTMLIFrameElement>(
        'iframe[title="教材"]',
      );
      const iframeDocument =
        iframeElement?.contentDocument ??
        iframeElement?.contentWindow?.document;

      if (iframeDocument) {
        exerciseElements = iframeDocument.querySelectorAll('.exercise');
      }
    }

    if (exerciseElements.length === 0) {
      return null;
    }

    let markdownContent = '';
    exerciseElements.forEach((element, index) => {
      if (index > 0) {
        markdownContent += '\n---\n\n';
      }
      markdownContent += `# Exercise ${index + 1}\n\n`;
      markdownContent += htmlToMarkdown(element.innerHTML);
    });

    return markdownContent;
  } catch (error) {
    logger.error(`Failed to get exercise content: ${error}`);
    return null;
  }
}

// Function to copy text to clipboard
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    logger.error(`Failed to copy to clipboard: ${error}`);
    return false;
  }
}

// Function to handle exercise copy from context menu
async function handleCopyExercise(): Promise<void> {
  const exerciseContent = getExerciseContent();

  if (exerciseContent === null) {
    window.alert('Error: No exercise content found with class="exercise"');
    logger.error('No exercise elements found');
    return;
  }

  const success = await copyToClipboard(exerciseContent);

  if (success) {
    window.alert('Exercise content copied to clipboard as Markdown!');
    logger.info('Exercise content copied to clipboard');
  } else {
    window.alert('Failed to copy exercise content to clipboard');
    logger.error('Failed to copy exercise content');
  }
}

// Function to handle ChatGPT question from context menu
async function handleAskChatGPT(): Promise<void> {
  const exerciseContent = getExerciseContent();

  if (exerciseContent === null) {
    logger.error('No exercise elements found for ChatGPT');
    return;
  }

  // Create the formatted question for ChatGPT
  const answerFormat = `Please analyze this exercise and provide a detailed answer.

Format your response as follows:
1. **Problem Analysis**: Briefly explain what the question is asking
2. **Solution**: Step-by-step solution or explanation
3. **Answer**: Final answer or conclusion
4. **Additional Notes**: Any relevant tips or concepts to remember

`;

  const fullQuestion = answerFormat + exerciseContent;

  // URL encode the question for ChatGPT
  const encodedQuestion = encodeURIComponent(fullQuestion);
  const chatGPTUrl = `https://chatgpt.com/?q=${encodedQuestion}`;

  // Open ChatGPT in a new tab
  try {
    window.open(chatGPTUrl, '_blank');
    logger.info('Opened ChatGPT with exercise question');
  } catch (error) {
    logger.error(`Failed to open ChatGPT: ${error}`);
  }
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: unknown) => {
  if (message && typeof message === 'object' && 'action' in message) {
    const action = (message as { action: string }).action;

    if (action === 'copyExercise') {
      void handleCopyExercise();
    } else if (action === 'askChatGPT') {
      void handleAskChatGPT();
    }
  }
});
