var configData = DEFAULT_CONFIG

function checkStoredSettings(item) {
  if (!item.configData) {
    browser.storage.local.set({
      configData
    });
  } else {
    configData = item.configData;
  }

  if (configData.showBorder) {
    document.querySelector('#config_HTML_border').setAttribute('checked', configData.showBorder);
  } else {
    document.querySelector('#config_HTML_border').removeAttribute('checked');
  }

  if (configData.honorThemeColor) {
    document.querySelector('#config_HTML_honorthemecolor').setAttribute('checked', configData.honorThemeColor);
  } else {
    document.querySelector('#config_HTML_honorthemecolor').removeAttribute('checked');
  }
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function updateSettings(e) {


  let dom_border_state = document.getElementById('config_HTML_border').checked;
  let dom_honorthemecolor_state = document.getElementById('config_HTML_honorthemecolor').checked;

  configData.showBorder = dom_border_state;
  configData.honorThemeColor = dom_honorthemecolor_state;

  browser.storage.local.set({
    configData
  });

  var metaData = {
    kind: 'refresh'
  }
  browser.runtime.sendMessage(metaData);
}

var gettingItem = browser.storage.local.get();
gettingItem.then(checkStoredSettings, onError);

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#config_HTML_border').onchange = updateSettings;
  document.querySelector('#config_HTML_honorthemecolor').onchange = updateSettings;

}, false);
