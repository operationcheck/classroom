import logger from 'logger';
import browser from 'webextension-polyfill';

// Handle messages from content script
browser.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message && typeof message === 'object' && 'action' in message) {
    if (message.action === 'createNotification' &&
        'title' in message &&
        'notificationMessage' in message) {
      const title = typeof message.title === 'string' ? message.title : 'Classroom Extension';
      const notificationMessage = typeof message.notificationMessage === 'string' ? message.notificationMessage : '';

      // Check and request notification permission if needed
      browser.permissions.contains({ permissions: ['notifications'] }).then((hasPermission) => {
        if (!hasPermission) {
          logger.warn('Notification permission not granted, requesting permission...');
          browser.permissions.request({ permissions: ['notifications'] }).then((granted) => {
            if (granted) {
              createNotificationNow();
            } else {
              logger.error('Notification permission denied by user');
              sendResponse({ success: false, error: 'Notification permission denied' });
            }
          }).catch((error) => {
            logger.error(`Failed to request notification permission: ${error}`);
            sendResponse({ success: false, error: error.message });
          });
        } else {
          createNotificationNow();
        }
      }).catch((error) => {
        logger.error(`Failed to check notification permission: ${error}`);
        // Try to create notification anyway
        createNotificationNow();
      });

      function createNotificationNow() {
        const notificationId = `classroom-${Date.now()}`;
        browser.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: title,
          message: notificationMessage
        }).then(() => {
          logger.info(`Notification created with ID: ${notificationId}, message: ${notificationMessage}`);
          sendResponse({ success: true, notificationId });
        }).catch((error) => {
          logger.error(`Failed to create notification: ${error}`);
          sendResponse({ success: false, error: error.message });
        });
      }
    } else {
      // Send response immediately for unhandled messages
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } else {
    // Send response immediately for invalid messages
    sendResponse({ success: false, error: 'Invalid message format' });
  }

  // Always return true to indicate we will send a response
  return true;
});

browser.runtime.onInstalled.addListener(() => {
  void browser.storage.local.get('enabled').then(() => {
    // Create the parent menu item
    browser.contextMenus.create({
      id: 'classroom',
      title: 'Classroom',
      contexts: ['all'],
    });

    // Create the toggle submenu items under Classroom
    browser.contextMenus.create({
      id: 'toggle',
      parentId: 'classroom',
      title: 'Toggle enabled',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'copyExercise',
      parentId: 'classroom',
      title: 'Copy exercise to clipboard',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'askAI',
      parentId: 'classroom',
      title: 'Ask AI',
      contexts: ['all'],
    });

    // AI service submenu items
    browser.contextMenus.create({
      id: 'askChatGPT',
      parentId: 'askAI',
      title: 'ChatGPT',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'askClaude',
      parentId: 'askAI',
      title: 'Claude',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'askGenspark',
      parentId: 'askAI',
      title: 'Genspark',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'askFelo',
      parentId: 'askAI',
      title: 'Felo',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'askPerplexity',
      parentId: 'askAI',
      title: 'Perplexity',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'copyAIPrompt',
      parentId: 'askAI',
      title: 'Copy prompt to clipboard',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'returnToChapter',
      parentId: 'classroom',
      title: 'Return to chapter on completion',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'hideUI',
      parentId: 'classroom',
      title: 'Hide UI buttons',
      contexts: ['all'],
    });

    browser.contextMenus.create({
      id: 'openRepository',
      parentId: 'classroom',
      title: 'Open repository',
      contexts: ['all'],
    });
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (info.menuItemId === 'toggle') {
      void browser.storage.local.get('enabled').then((data) => {
        const enabled = data.enabled !== true; // Toggle the enabled state
        void browser.storage.local.set({ enabled });
        logger.info(`Extension is now ${enabled ? 'enabled' : 'disabled'}`);
      });
    } else if (info.menuItemId === 'copyExercise') {
      // Send message to content script to copy exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'copyExercise' })
          .catch((error) => {
            logger.error(`Failed to send copyExercise message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'askChatGPT') {
      // Send message to content script to ask ChatGPT about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'askChatGPT' })
          .catch((error) => {
            logger.error(`Failed to send askChatGPT message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'askClaude') {
      // Send message to content script to ask Claude about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'askClaude' })
          .catch((error) => {
            logger.error(`Failed to send askClaude message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'askGenspark') {
      // Send message to content script to ask Genspark about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'askGenspark' })
          .catch((error) => {
            logger.error(`Failed to send askGenspark message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'askFelo') {
      // Send message to content script to ask Felo about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'askFelo' })
          .catch((error) => {
            logger.error(`Failed to send askFelo message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'askPerplexity') {
      // Send message to content script to ask Perplexity about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'askPerplexity' })
          .catch((error) => {
            logger.error(`Failed to send askPerplexity message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'copyAIPrompt') {
      // Send message to content script to copy AI prompt
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: 'copyAIPrompt' })
          .catch((error) => {
            logger.error(`Failed to send copyAIPrompt message: ${error}`);
          });
      }
    } else if (info.menuItemId === 'returnToChapter') {
      void browser.storage.local.get('returnToChapter').then((data) => {
        const returnToChapter = data.returnToChapter !== true; // Toggle the return to chapter state
        void browser.storage.local.set({ returnToChapter });
        logger.info(
          `Return to chapter is now ${returnToChapter ? 'enabled' : 'disabled'}`,
        );
      });
    } else if (info.menuItemId === 'hideUI') {
      void browser.storage.local.get('hideUI').then((data) => {
        const hideUI = data.hideUI !== true; // Toggle the hideUI state
        void browser.storage.local.set({ hideUI });
        logger.info(`UI buttons are now ${hideUI ? 'hidden' : 'visible'}`);
      });
    } else if (info.menuItemId === 'openRepository') {
      // Open the repository in a new tab
      browser.tabs.create({
        url: 'https://github.com/operationcheck/classroom'
      }).then(() => {
        logger.info('Repository opened in new tab');
      }).catch((error) => {
        logger.error(`Failed to open repository: ${error}`);
      });
    }
  } catch (error) {
    logger.error(`Context menu error: ${error}`);
  }
});
