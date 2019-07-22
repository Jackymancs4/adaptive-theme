function sendThemeColor() {
  var sending = browser.runtime.sendMessage({
    kind: 'theme-color',
    value: document.querySelector('meta[name=theme-color]').getAttribute('content')
  });
}

sendThemeColor()
