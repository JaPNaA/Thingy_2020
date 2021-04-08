# Jisho with History

辞書[jisho] (a dictionary, in Japanese), and also the name of [jisho.org](https://jisho.org/).

The site is wonderful, but the problem is that I'll end up opening dozens of tabs while reading, and then I have to sort through them all later.

The goal is to stop me from open 50+ tabs whenever I read something.

[Click to go to the web app](web/)

## API

JishoWithHistory can export via postMessage.

To setup JishoWithHistory, `open` it from JavaScript or put it in an `<iframe>`.

Then, postMessage it the name of your app when it postMessages `get:jishoWithHistoryRecieverName`.

```javascript
const jishoWindow = open("https://japnaa.github.io/Thingy_2020/jishoWithHistory/web/");

addEventListener("message", event => {
  if (event.data === "get:jishoWithHistoryRecieverName") {
    jishoWindow.postMessage("My App", "*");
  }
});
```

When the user clicks _EXPORT_ and then _SEND TO {My App}_, your app will receive another message containing the export.

```javascript
addEventListener("message", event => {
  if (event.data.startsWith("export:")) {
    alert(event.data); // "export:[ {... JSON data} ]"
  }
});
```

## Todo

  - notes
