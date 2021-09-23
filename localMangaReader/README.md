# Local Manga Reader

Upload a manga ZIP or folder of images to view it like a manga!

Great for legitimately downloaded copies of manga.

---

## Embedding Protocol

The embedding protocol allows you to embed localMangaReader on your own website with your own content.

The protocol is done through `postMessage`s.

### Setup

Embed `https://japnaa.github.io/Thingy_2020/localMangaReader/` on your website.

```html
<iframe src="https://japnaa.github.io/Thingy_2020/localMangaReader/"><>
```

Tell the reader you want to put your own content on it by posting `enableEmbedMode`.

```js
const readerFrame = document.querySelector("iframe[src='https://japnaa.github.io/Thingy_2020/localMangaReader/']"]);

readerFrame.addEventListener("load", function() {
    readerFrame.contentWindow.postMessage("enableEmbedMode", readerFrame.src);
});
```

### getDirectory -> setDirectory

Upon reciving `enableEmbedMode`, `readerFrame` will `postMessage` a string back to your webpage: `getDirectory`. It is asking for a list of the files you want the reader to show.

```js
addEventListener("message", function(event) {
    if (event.data === "getDirectory") {
        // TODO: handle getDirectory
    }
})
```

You should `postMessage` back a string starting with `"setDirectory:"`, followed by a JSON string.

The format of this JSON string shoud look like the following (without comments):

```jsonc
{
    "directories": {
        // each key will be treated like a file path
        "volume1/chapter1": {
            // first page number; optional, default is 1; inclusive
            "start": 1,
            // last page number; required; inclusive
            "end": 19
        },
        "volume1/chapter2": {
            "end": 19
        },
        "extras": {
            "end": 10
        },
        // ... etc.
    }
}
```

The website expects something like the following to come back:

```json
setDirectory:{"directories":{"volume1/chapter1":{"start": 1,"end": 19},"volume1/chapter2":{"end": 19},"extras":{"end": 10}}}
```

### getPageSrc -> setPageSrc

A `getPageSrc` message will look like the following:

```json
getPageSrc:{"returnId":12,"directory":"volume1/chapter1","page":9}
```

- Before the colon `:` is the command. `getPageSrc` means the reader is requesting for a page's image's source
- After the colon `:` is JSON.
    - `directory` is the string you specified in `setDirectory`
    - `page` is the page number being requested

You should return something like the following:

```json
setPageSrc:{"returnId":12,"src":"https://my.website.com/media/volume1/chapter1/0009.png"}
```

- `returnId` should be the same as what you recieved -- it is used internally to keep track of pages.
- `src` is the source of the image. This reader supports any file format the browser supports.
    - you may also send a `data:image/png;base64, ...` via `src` as well.
