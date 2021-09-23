// --- Language Loading

import { Elm, InputElm } from "./elements.js";

const availableLangs = ['en', 'ja'];

// availableLangs.length = 1; // for testing purposes

const userLang = navigator.languages.find(lang => availableLangs.includes(lang)) || availableLangs[0];
const langMapProm = (async function setUserLanguage() {
    /** @type { {[x: string]: string } } */
    let langMap = {};

    const textData = await fetch("intl/" + userLang + ".csv").then(e => e.text());
    const lines = textData.split("\n");
    const map = new Map();

    for (const line of lines) {
        if (!line) { continue; }
        const firstCommaIndex = line.indexOf(",");
        langMap[line.slice(0, firstCommaIndex)] = line.slice(firstCommaIndex + 1);
    }

    return langMap;
})();

/**
 * @param {string} key 
 */
function createLocaleStringSpan(key) {
    const elm = new Elm("span");
    langMapProm.then(map => elm.replaceContents(map[key]));
    return elm;
}

langMapProm.then(map => document.title = map.localMangaReaderTitle);

// ---

class PageFile {
    /**
     * @param {ChapterFiles} parentChapter
     * @param {LoadableFile} loadableFile
     * @param {string} fileName
     * @param {number} [pageNumber=-1] 
     */
    constructor(parentChapter, loadableFile, fileName, pageNumber) {
        this.parent = parentChapter;
        this.fileName = fileName;
        this.loadableFile = loadableFile;
        this.pageNumber = pageNumber === undefined ? -1 : pageNumber;

        this.img = document.createElement("img");
        this.img.classList.add("page");
        this.img.alt = fileName;

        this.img.addEventListener("load", () => {
            if (this.img.width > this.img.height) {
                parentChapter.toggleBlankPageBefore(this);
            }
        }, { once: true });

        this.img.addEventListener("dblclick", () => {
            parentChapter.toggleBlankPageBefore(this);
        });
    }

    async loadFile() {
        this.img.src = URL.createObjectURL(await this.loadableFile.loadFile());
    }
}


const pageNumberRegex = /(\d+)/g;

class ChapterFiles {
    /**
     * @param {FileDirectory} directory 
     */
    constructor(directory) {
        this.directory = directory;
        /** @type {(PageFile | null)[]} */
        this.pages = [];
        /** @type {(PageFile | null)[]} */
        this.displayPages = [];

        this.pagesPerRow = 2;

        this.pagesLoaded = 0;
        this.pageLoadBufferMin = 2;
        this.pageLoadBufferStep = 50;
        this.scrollLazyLoadTriggerTreshold = 0;

        this.elm = document.createElement("div");
        this.elm.classList.add("chapter");

        resizeSubscribers.push(() => this.resizeHandler());
        this.resizeHandler();

        this.initializeAndOrganizePageFiles();
        this.updateElements();
        this.loadFilesUpTo(0);
    }

    resizeHandler() {
        const newPagesPerRow = (portraitMode || wideMode) ? 1 : 2;
        if (newPagesPerRow != this.pagesPerRow) {
            this.pagesPerRow = newPagesPerRow;
            this.updateElements();
        }

        if (portraitMode) {
            this.elm.classList.add("portrait");
        } else {
            this.elm.classList.remove("portrait");
        }

        if (wideMode) {
            this.elm.classList.add("wide");
        } else {
            this.elm.classList.remove("wide");
        }
    }

    initializeAndOrganizePageFiles() {
        /** @type {PageFile[]} */
        const mainPages = [];

        /** @type {PageFile[]} */
        const extraPages = [];

        for (const [name, file] of this.directory.items) {
            if (!(file instanceof LoadableFile)) { continue; }

            const match = name.match(pageNumberRegex);
            if (match) {
                mainPages.push(new PageFile(this, file, name, parseInt(match[match.length - 1])));
            } else {
                extraPages.push(new PageFile(this, file, name));
            }
        }

        mainPages.sort((a, b) => a.pageNumber - b.pageNumber);
        extraPages.sort((a, b) => a.fileName < b.fileName ? -1 : 1);

        for (const page of mainPages) {
            this.pages.push(page);
        }
        for (const page of extraPages) {
            this.pages.push(page);
        }

        this.displayPages = this.pages.slice();
        this.displayPages.unshift(null);
    }

    updateElements() {
        while (this.elm.firstElementChild) { this.elm.removeChild(this.elm.firstElementChild); }

        for (let i = 0; i < this.displayPages.length; i += this.pagesPerRow) {
            const rowElm = document.createElement("div");
            const rowArr = [];
            rowElm.classList.add("row");
            let actualPagesInRow = 0;

            for (let j = 0; j < this.pagesPerRow; j++) {
                const page = this.displayPages[i + j];
                if (page) {
                    rowElm.appendChild(page.img);
                    rowArr.push(page);
                    actualPagesInRow++;
                }
            }

            if (actualPagesInRow === 1) {
                rowElm.classList.add("singlePage");
            }

            this.elm.appendChild(rowElm);
        }
    }

    /** @returns {number} */
    closestRowY(yPosition) {
        const approximateRowIndex = this.closestRowIndexAtY(yPosition);
        /** @type {HTMLDivElement} */ // @ts-ignore
        const row = this.elm.children[approximateRowIndex];

        if (row) {
            return row.offsetTop;
        } else {
            return approximateRowIndex * this.getPageHeight();
        }
    }

    /** @param {number} yPosition */
    closestRowIndexAtY(yPosition) {
        const yRelative = yPosition - this.elm.offsetTop;
        const approximateRowIndex = Math.round(yRelative / this.getPageHeight());

        return approximateRowIndex;
    }

    getPageHeight() {
        const firstRow = this.elm.firstElementChild;
        return firstRow.getBoundingClientRect().height + 16; // 16 is margin-bottom
    }

    /** @param {number} yPosition */
    loadFilesUpTo(yPosition) {
        if (yPosition < this.scrollLazyLoadTriggerTreshold) { return; }

        const closestRowY = this.closestRowIndexAtY(yPosition) + 1;
        const displayPageIndex = Math.min(this.pagesPerRow * closestRowY, this.pages.length - 1);
        const pageIndex = this.pages.indexOf(this.displayPages[displayPageIndex]) + this.pageLoadBufferMin;

        if (pageIndex < this.pagesLoaded) {
            this.scrollLazyLoadTriggerTreshold =
                Math.max(yPosition + innerHeight, this.scrollLazyLoadTriggerTreshold);
            return;
        }

        const pagesToLoad = Math.min(pageIndex + this.pageLoadBufferStep, this.pages.length);

        for (let i = this.pagesLoaded; i < pagesToLoad; i++) {
            this.pages[i].loadFile();
        }

        this.pagesLoaded = pagesToLoad;
        this.scrollLazyLoadTriggerTreshold =
            this.displayPages.indexOf(this.pages[pagesToLoad - 1]) / this.pagesPerRow * this.getPageHeight();
    }

    /** @param {PageFile} page */
    toggleBlankPageBefore(page) {
        const index = this.displayPages.indexOf(page);
        if (this.displayPages[index - 1] === null) {
            this.displayPages.splice(index - 1, 1);
        } else {
            this.displayPages.splice(index, 0, null);
        }
        this.updateElements();
    }
}

class FileDisplay {
    constructor() {
        /** @type {ChapterFiles[]} */
        this.chapters = [];
        /** @type {ChapterFiles | undefined} */
        this.currentChapter = undefined;

        this.elm = document.createElement("div");
        this.elm.classList.add("pagesDisplay");

        this.chapterSelectElm = document.createElement('div');
        this.chapterSelectElm.classList.add("chapterSelect");
        this.elm.appendChild(this.chapterSelectElm);

        this.chapterContainer = document.createElement("diiv");
        this.chapterContainer.classList.add("chapterContainer");
        this.elm.appendChild(this.chapterContainer);
    }

    /**
     * @param {ChapterFiles} chapter 
     * @param {string | undefined} name
     */
    addChapter(chapter, name) {
        this.chapters.push(chapter);

        const chapterOption = document.createElement("div");
        chapterOption.innerText = name || "root";
        chapterOption.addEventListener("click", () => {
            this.setChapter(chapter);
        });
        this.chapterSelectElm.appendChild(chapterOption);
    }

    /**
     * @param {ChapterFiles} chapter 
     */
    setChapter(chapter) {
        this._clearChapterContainer();
        this.chapterContainer.appendChild(chapter.elm);
        this.currentChapter = chapter;
    }

    _clearChapterContainer() {
        while (this.chapterContainer.firstChild) {
            this.chapterContainer.removeChild(this.chapterContainer.firstChild);
        }
    }
}

class LoadableFile {
    /**
     * @typedef {() => Promise<Blob>} FileLoader
     * @param {Blob | FileLoader} fileOrLoader
     */
    constructor(fileOrLoader) {
        if (typeof fileOrLoader === "function") {
            this.loader = fileOrLoader;
            this.loadedFile = null;
        } else {
            this.loader = null;
            this.loadedFile = fileOrLoader;
        }
    }

    /**
     * @return {Promise<Blob> | Blob}
     */
    loadFile() {
        if (this.loadedFile) { return this.loadedFile; }
        if (this.loadingPromise) { return this.loadingPromise; }
        this.loadingPromise = this.loader();
        this.loadingPromise.then(blob => this.loadedFile = blob);
        return this.loadingPromise;
    }
}

class FileDirectory {
    constructor() {
        /** @type {Map<string, LoadableFile | FileDirectory>} */
        this.items = new Map();
        /** @type {string | undefined} */
        this.name = undefined;
        /** @type {string | undefined} */
        this.parentPath = undefined;
    }

    /**
     * @param {string} path 
     * @param {LoadableFile} file 
     */
    addBlob(path, file) {
        const pathParts = path.split("/");
        let fileName = pathParts.pop();

        /** @type {FileDirectory} */
        let currDirectory = this;
        for (const part of pathParts) {
            let nextDirectory = currDirectory.items.get(part);
            if (nextDirectory === undefined) {
                nextDirectory = new FileDirectory();
                nextDirectory.name = part;
                nextDirectory.parentPath = (currDirectory.parentPath || "/") + (currDirectory.name || "") + "/";
                currDirectory.items.set(part, nextDirectory);
            } else if (!(nextDirectory instanceof FileDirectory)) {
                throw new Error("Cannot create folder, name already taken");
            }

            currDirectory = nextDirectory;
        }

        currDirectory.items.set(fileName, file);
    }
}

const supportedSet = new Set(["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg", "webp", "bmp", "ico", "cur", "tif", "tiff"]);

/** @param {string} name */
function isImageFile(name) {
    const ext = name.slice(name.lastIndexOf(".") + 1);
    return supportedSet.has(ext);
}

/** @type {Elm} */
let filesInputLabelText;

const fileDisplay = new FileDisplay();

const directoryFileInput = new InputElm().setType("file").attribute("multiple").attribute("webkitdirectory").attribute("directory")
    .on("change", async () => {
        const directory = new FileDirectory();

        // @ts-ignore
        for (const file of directoryFileInput.elm.files) {
            const path = file.webkitRelativePath;
            if (!isImageFile(path)) { continue; }
            directory.addBlob(path, new LoadableFile(file));
        }

        updateFiles(directory);

        filesInputLabelText.replaceContents((await langMapProm).selectAdditionalMangaFolder);
    });

const zipFileInput = new InputElm().setType("file").attribute("accept", "application/zip")
    .on("change", async function (e) {
        await loadJSZip();
        const zip = new JSZip();
        // @ts-ignore
        await zip.loadAsync(zipFileInput.elm.files[0]);

        const directory = new FileDirectory();

        zip.forEach(function (relPath, file) {
            if (!isImageFile(relPath)) { return; }
            directory.addBlob(relPath,
                new LoadableFile(async () => await file.async("blob"))
            );
        });

        updateFiles(directory);
    });

const wideViewCheckbox = new InputElm().setType("checkbox")
    .on("change", function () {
        // @ts-expect-error
        wideMode = wideViewCheckbox.getValue();
        resizeHandler();
    });

new Elm("div").class("main").append(
    fileDisplay.elm,

    new Elm().class("controlsContainer").append(
        new Elm("h1").append(createLocaleStringSpan("selectFile")),

        new Elm("label").append(
            filesInputLabelText = createLocaleStringSpan("selectMangaFolder").class("block"),
            directoryFileInput
        ),

        new Elm("label").append(
            createLocaleStringSpan("selectMangaZip").class("block"),
            zipFileInput
        ),

        new Elm("h1").append(createLocaleStringSpan("viewerOptions")),

        new Elm("label").append(
            wideViewCheckbox,
            createLocaleStringSpan("wideView")
        )
    )
).appendTo(document.body);


/**
 * @param {FileDirectory} directory
 */
function updateFiles(directory) {
    let dirQue = [directory];

    while (dirQue.length > 0) {
        const currDir = dirQue.pop();
        let addedDir = false;

        // sort is reversed because directories added to dirQue will be read in reverse order
        const sortedEntries = Array.from(currDir.items).sort((a, b) => a[0] < b[0] ? 1 : -1);

        for (const [path, item] of sortedEntries) {
            if (item instanceof FileDirectory) {
                dirQue.push(item);
            } else {
                if (addedDir) { continue; }
                const chapterFiles = new ChapterFiles(currDir);
                fileDisplay.addChapter(chapterFiles, currDir.parentPath + currDir.name);
                addedDir = true;
            }
        }
    }

    console.log(directory);
}

addEventListener("keydown", function (e) {
    let goingUp = e.key === "ArrowUp" || e.key === "ArrowRight";
    let goingDown = e.key === "ArrowDown" || e.key === "ArrowLeft";
    if (!(goingUp || goingDown)) { return; }

    e.preventDefault();

    // in wideMode, prefer page up/down-like functionality (pages expected be higher than screen)
    const pageHeight = wideMode ? innerHeight * 0.8 : innerHeight;

    let newScroll = document.documentElement.scrollTop;

    if (goingDown) {
        newScroll += pageHeight;
    } else if (goingUp) {
        newScroll -= pageHeight;
    }

    document.documentElement.scrollTop =
        wideMode ?
            newScroll :
            fileDisplay.currentChapter.closestRowY(newScroll);
});

addEventListener("scroll", function () {
    fileDisplay.currentChapter.loadFilesUpTo(document.documentElement.scrollTop);
});

let lastWidth = -1;
let lastHeight = -1;

addEventListener("resize", function () {
    if (lastWidth === innerWidth && lastHeight === innerHeight) {
        setTimeout(resizeHandler, 200); // for iOS
    } else {
        resizeHandler();
    }
});

/** @type {function[]} */
const resizeSubscribers = [];

let portraitMode = false;
let wideMode = false;

function resizeHandler() {
    lastWidth = innerWidth;
    lastHeight = innerHeight;

    portraitMode = innerHeight > innerWidth;

    for (const subscriber of resizeSubscribers) {
        subscriber();
    }
}

resizeHandler();

async function loadJSZip() {
    // @ts-ignore
    if (window.JSZip) { return JSZip; }

    await fetch("./libs/jszip.min.js")
        .then(e => e.text())
        .then(e => eval(e));

    return JSZip;
}

{
    /** @type {FileDirectory} */
    let directory;

    const loadingFileMap = new Map();

    addEventListener("message", function (event) {
        if (typeof event.data !== "string") { return; }
        const colonIndex = event.data.indexOf(":");
        let command;
        let argument = null;

        if (colonIndex < 0) {
            command = event.data;
        } else {
            command = event.data.slice(0, colonIndex);
            argument = JSON.parse(event.data.slice(colonIndex + 1));
        }

        function returnMessage(command, message) {
            // @ts-ignore
            event.source.postMessage(command + ":" + JSON.stringify(message), event.origin);
        }

        switch (command) {
            case "enableEmbedMode":
                returnMessage("get", "pages");

                directory = new FileDirectory();

                break;
            case "sent pages":
                if (!argument) { break; }
                for (let i = argument.start; i < argument.end; i++) {
                    directory.addBlob(i.toString(), new LoadableFile(() => new Promise(res => {
                        loadingFileMap.set(i, res);
                        returnMessage("getPageSrc", i);
                    })));
                }

                updateFiles(directory);

                break;
            case "pageSrc":
                if (!argument) { break; }
                const [number, src] = argument;
                const promRes = loadingFileMap.get(number);
                if (promRes) {
                    promRes(fetch(src).then(e => e.blob()));
                }
                break;
        }
    });
}
