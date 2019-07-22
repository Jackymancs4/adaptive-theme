let indexedColorMap = new Array();
let indexedStateMap = new Array();
let currentActiveTab = null;
let pendingApplyColor = null;

var configData = DEFAULT_CONFIG

function checkStoredSettings(item) {
  if (!item.configData) {
    browser.storage.local.set({
      DEFAULT_CONFIG
    });
  } else {
    configData = item.configData;
  }
}
function onError(error) {
}

/* This is more aggressive override..*/

function updateActiveTab_pageloaded(tabId, changeInfo) {

  function updateTab(tabs) {
    if (tabs[0]) {
      var tabURLkey = tabs[0].url;

      if (pendingApplyColor) {
        indexedStateMap[tabURLkey] = 3;
        pendingApplyColor = null;
      }

      if (indexedStateMap[tabURLkey] != 3 && changeInfo.status == 'complete') {

        currentActiveTab = tabURLkey;
        var capturing = browser.tabs.captureVisibleTab();
        capturing.then(onCaptured, onError);
      }

    }
  }
  var gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true
  });
  gettingActiveTab.then(updateTab);

}

function updateActiveTab(tabId, changeInfo) {

  function updateTab(tabs) {
    if (tabs[0]) {
      var tabURLkey = tabs[0].url;

      if (pendingApplyColor) {
        indexedStateMap[tabURLkey] = 3;
        pendingApplyColor = null;
      }

      if (tabURLkey in indexedColorMap) {

        let colorObject = indexedColorMap[tabURLkey];

        let colorUI = "#000000"
        let colorText = pickTextColorBasedOnBgColorAdvanced(colorUI, '#ffffff', '#000000')

        let themeProposal = getTheme(colorUI, colorText);
        themeProposal.colors = colorObject;
        util_custom_update(themeProposal);

      } else {
        currentActiveTab = tabURLkey;
        var capturing = browser.tabs.captureVisibleTab();
        capturing.then(onCaptured, onError);
      }
    }
  }

  var gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true
  });
  gettingActiveTab.then(updateTab);
}

// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/captureVisibleTab
function onCaptured(imageUri) {
  let canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  canvasContext = canvas.getContext('2d');
  //canvasContext.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
  let image = document.createElement('img');

  image.onload = function () {
    //
    canvasContext.drawImage(image, 0, 0);
    canvasData = canvasContext.getImageData(0, 0, 100, 10).data;
    canvasIndex = 510 * 4;

    let colorUI = rgbToHex(canvasData[canvasIndex], canvasData[canvasIndex + 1], canvasData[canvasIndex + 2], )
    let colorText = pickTextColorBasedOnBgColorAdvanced(colorUI, '#ffffff', '#000000')

    let themeProposal = getTheme(colorUI, colorText);

    if (currentActiveTab) {
      //
      indexedColorMap[currentActiveTab] = themeProposal.colors;
    }

    util_custom_update(themeProposal);
  }
  image.src = imageUri;
}

function onError(error) {

}

/*
  Receiving message from content scripts
*/

function notify(message, sender) {
  if ('kind' in message) {
    if (message.kind == 'refresh') {
      function refreshAsync(item) {
        configData = item.configData;
        updateActiveTab();
      }
      let gettingItem = browser.storage.local.get();
      gettingItem.then(refreshAsync, onError);
    }

    if (message.kind == 'theme-color' && configData.honorThemeColor) {

      let colorUI = message.value
      let colorText = pickTextColorBasedOnBgColorAdvanced(colorUI, '#ffffff', '#000000')

      let themeProposal = getTheme(colorUI, colorText);

      pendingApplyColor = themeProposal.colors;
      indexedColorMap[sender.tab.url] = pendingApplyColor;

      // update the theme, if the message came from the active tab
      var gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
      });
      gettingActiveTab.then(function (activeTabs) {
        if (activeTabs[0].id === sender.tab.id) {
          util_custom_update(themeProposal);
        }
      });
    }
  }
}

browser.runtime.onMessage.addListener(notify);

/*
   Utils
*/

function util_custom_update(themeProposal) {
  let themeProposal_copy = JSON.parse(JSON.stringify(themeProposal));

  if (!configData.showBorder) {

    delete themeProposal_copy.colors.popup_border;
    delete themeProposal_copy.colors.sidebar_border;
    delete themeProposal_copy.colors.toolbar_field_border;
    // delete themeProposal_copy.colors.toolbar_top_separator;
    delete themeProposal_copy.colors.toolbar_bottom_separator;

  }

  browser.theme.update(themeProposal_copy);
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function pickTextColorBasedOnBgColorAdvanced(bgColor, lightColor, darkColor) {
  var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  var r = parseInt(color.substring(0, 2), 16); // hexToR
  var g = parseInt(color.substring(2, 4), 16); // hexToG
  var b = parseInt(color.substring(4, 6), 16); // hexToB
  var uicolors = [r / 255, g / 255, b / 255];
  var c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });
  var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
  return (L > 0.179) ? darkColor : lightColor;
}

function getTheme(colorUI, colorText) {
  let themeColors = {
    "bookmark_text": colorText,
    "button_background_active": null,
    "button_background_hover": null,
    "frame": colorUI,
    "frame_inactive": colorUI,
    "icons": colorText,
    "icons_attention": null,
    "ntp_background": colorUI,
    "ntp_text": colorText,
    "popup": colorUI,
    "popup_border": colorUI,
    "popup_highlight": null,
    "popup_highlight_text": colorText,
    "popup_text": colorText,
    "sidebar": colorUI,
    "sidebar_border": colorUI,
    "sidebar_highlight": null,
    "sidebar_highlight_text": colorText,
    "sidebar_text": colorText,
    "tab_background_separator": null,
    "tab_background_text": colorText,
    "tab_line": colorText,
    "tab_loading": colorText,
    "tab_selected": colorUI,
    "tab_text": colorText,
    "toolbar": colorUI,
    "toolbar_bottom_separator": colorUI,
    "toolbar_field": null,
    "toolbar_field_border": colorUI,
    "toolbar_field_border_focus": null,
    "toolbar_field_focus": null,
    "toolbar_field_highlight": null,
    "toolbar_field_highlight_text": null,
    "toolbar_field_separator": null,
    "toolbar_field_text": null,
    "toolbar_field_text_focus": null,
    "toolbar_top_separator": null,
    "toolbar_vertical_separator": null
  }

  return {
    colors: themeColors
  }

}

var gettingItem = browser.storage.local.get();
gettingItem.then(checkStoredSettings, onError);

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  updateActiveTab_pageloaded(tabId, changeInfo)
  updateActiveTab(tabId, changeInfo)
});

updateActiveTab();
