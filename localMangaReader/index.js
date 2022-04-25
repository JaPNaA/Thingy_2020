// --- Language Loading

import { Component, Elm, InputElm } from "./elements.js";

const availableLangs = ['en', 'ja'];

// availableLangs.length = 1; // for testing purposes

const userLang = navigator.languages.find(lang => availableLangs.includes(lang)) || availableLangs[0];
const langMapProm = (async function setUserLanguage() {
    /** @type { {[x: string]: string } } */
    let langMap = {};

    const textData = await fetch("intl/" + userLang + ".csv").then(e => e.text());
    const lines = textData.split("\n");

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
    langMapProm.then(map => elm.replaceContents(map[key] || key));
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
        const pages = [];

        for (const [name, file] of this.directory.items) {
            if (!(file instanceof LoadableFile)) { continue; }

            const match = name.match(pageNumberRegex);
            let pageFile;
            if (match) {
                pageFile = new PageFile(this, file, name, parseInt(match[match.length - 1]));
            } else {
                pageFile = new PageFile(this, file, name);
            }
            pages.push(pageFile);
        }

        sortStringsNumbered(pages, page => page.fileName);

        for (const page of pages) {
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
        const displayPageIndex = Math.min(this.pagesPerRow * closestRowY, this.displayPages.length - 1);
        const pageIndex = this.displayPageToPageIndex(displayPageIndex) + this.pageLoadBufferMin;

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

    /** @param {number} displayPageIndex */
    displayPageToPageIndex(displayPageIndex) {
        let nonNullDisplayPage = null;
        let i = displayPageIndex;
        while (i >= 0 && nonNullDisplayPage === null) {
            nonNullDisplayPage = this.displayPages[i--];
        }
        return this.pages.indexOf(nonNullDisplayPage);
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

class FileDisplay extends Component {
    constructor() {
        super("fileDisplay");

        /** @type {ChapterFiles[]} */
        this.chapters = [];
        /** @type {ChapterFiles | undefined} */
        this.currentChapter = undefined;

        this.elm.append(
            this.chapterSelectContainer = new Elm().class("chapterSelectContainer", "grayBox", "hidden").append(
                new Elm("h1").append(createLocaleStringSpan('selectChapter')),
                this.chapterSelectElm = new Elm().class("chapterSelect")
            ),
            this.chapterContainer = new Elm().class("chapterContainer")
        );
    }

    /**
     * @param {ChapterFiles} chapter 
     * @param {string | undefined} name
     */
    addChapter(chapter, name) {
        this.chapters.push(chapter);
        this.chapterSelectContainer.removeClass("hidden");

        this.chapterSelectElm.append(
            new Elm().class("chapterDirectory").append(name || "root")
                .on("click", () => {
                    this.setChapter(chapter);
                }));
    }

    /**
     * @param {ChapterFiles} chapter 
     */
    setChapter(chapter) {
        this.chapterContainer.clear();
        this.chapterContainer.append(chapter.elm);
        this.currentChapter = chapter;
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

class CanvasPool {
    constructor() {
        /** @type {{canvas: HTMLCanvasElement, X: CanvasRenderingContext2D, inUse: boolean}[]} */
        this._canvases = [];
    }

    /** @param {({canvas: HTMLCanvasElement, X: CanvasRenderingContext2D}) => Promise<any>} f */
    async useCanvas(f) {
        let canvas;
        for (const existing of this._canvases) {
            if (!existing.inUse) {
                canvas = existing;
            }
        }

        if (!canvas) {
            canvas = this._createCanvas();
        }

        canvas.inUse = true;
        await f(canvas)
        canvas.inUse = false;
    }

    _createCanvas() {
        const canvasElm = document.createElement("canvas");
        const newCanvas = {
            canvas: canvasElm,
            X: canvasElm.getContext("2d"),
            inUse: false
        };
        this._canvases.push(newCanvas);
        return newCanvas;
    }
}

const supportedSet = new Set(["apng", "avif", "gif", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg", "webp", "bmp", "ico", "cur", "tif", "tiff"]);

/** @param {string} name */
function isImageFile(name) {
    const ext = name.slice(name.lastIndexOf(".") + 1);
    return supportedSet.has(ext);
}

const CLUSTER_REGEX = /(\d+)|(\D+)/g;
const NUMBER_REGEX = /^\d/;

/**
 * Sorts strings, parsing numbers in between
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} mapper
 * @returns {T[]}
 */
function sortStringsNumbered(items, mapper) {
    /** @type {[T, (string|number)[]][]} */
    const itemsAndStringSegs = [];
    for (const item of items) {
        const segments = mapper(item).match(CLUSTER_REGEX)
            .map(match => NUMBER_REGEX.test(match) ? parseInt(match) : match);
        itemsAndStringSegs.push([item, segments]);
    }
    return itemsAndStringSegs.sort((a, b) => {
        const aSeg = a[1];
        const bSeg = b[1];
        const shorter = Math.min(aSeg.length, bSeg.length);
        for (let i = 0; i < shorter; i++) {
            if (typeof aSeg[i] != typeof bSeg[i]) {
                // fail-safe/redundant (should never reach this time)
                return typeof aSeg[i] === "number" ? -1 : 1;
            }
            if (aSeg[i] < bSeg[i]) {
                return -1;
            } else if (aSeg[i] > bSeg[i]) {
                return 1;
            }
        }

        // shorter first
        return aSeg.length - bSeg.length;
    }).map(stringAndSegment => stringAndSegment[0]);
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

const pdfFileInput = new InputElm().setType("file").attribute("accept", "application/pdf")
    .on("change", async function (e) {
        //
        await loadPDFJS();
        /** @type {HTMLInputElement} */ // @ts-ignore
        const input = pdfFileInput.elm;
        const pdf = await pdfJS.getDocument(URL.createObjectURL(input.files[0])).promise;

        const directory = new FileDirectory();
        const canvasPool = new CanvasPool();
        console.log(canvasPool);

        for (let i = 1; i <= pdf.numPages; i++) {
            directory.addBlob(i.toString(), new LoadableFile(async () => {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                let blob;

                await canvasPool.useCanvas(async context => {
                    context.canvas.width = viewport.width;
                    context.canvas.height = viewport.height;
                    await page.render({
                        canvasContext: context.X,
                        transform: null,
                        viewport: viewport
                    }).promise;
                    blob = new Promise(res => {
                        context.canvas.toBlob(blob => res(blob));
                    });
                });

                return blob;
            }))
        }

        updateFiles(directory);

    })

const wideViewCheckbox = new InputElm().setType("checkbox")
    .on("change", function () {
        // @ts-expect-error
        wideMode = wideViewCheckbox.getValue();
        resizeHandler();
    });

new Elm("div").class("main").append(
    fileDisplay.elm,

    new Elm().class("controlsContainer", "grayBox").append(
        new Elm("h1").append(createLocaleStringSpan("selectFile")),

        new Elm("label").append(
            filesInputLabelText = createLocaleStringSpan("selectMangaFolder").class("block"),
            directoryFileInput
        ),

        new Elm("label").append(
            createLocaleStringSpan("selectMangaZip").class("block"),
            zipFileInput
        ),

        new Elm("label").append(
            createLocaleStringSpan("selectPDF").class("block"),
            pdfFileInput
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

        // reversed because directories added to dirQue will be read in reverse order
        const sortedEntries = sortStringsNumbered(Array.from(currDir.items), item => item[0]).reverse();

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

/** @param {number} pages */
function scrollPagesBy(pages) {
    // in wideMode, prefer page up/down-like functionality (pages expected be higher than screen)
    const pageHeight = wideMode ? innerHeight * 0.8 : innerHeight;

    let newScroll = document.documentElement.scrollTop + pages * pageHeight;

    document.documentElement.scrollTop =
        wideMode ?
            newScroll :
            fileDisplay.currentChapter.closestRowY(newScroll);
}

addEventListener("keydown", function (e) {
    let goingUp = e.key === "ArrowUp" || e.key === "ArrowRight";
    let goingDown = e.key === "ArrowDown" || e.key === "ArrowLeft";
    if (!(goingUp || goingDown)) { return; }

    e.preventDefault();

    let deltaPage = 0;
    if (goingDown) {
        deltaPage += 1;
    } else if (goingUp) {
        deltaPage -= 1;
    }

    scrollPagesBy(deltaPage);
});

let touchDragged = false;

addEventListener("touchstart", () => { touchDragged = false; });
addEventListener("touchmove", () => { touchDragged = true; });
addEventListener("touchend", e => {
    if (touchDragged) { return; }
    const touchX = e.changedTouches[0].clientX;
    let deltaPage = 0;

    if (touchX < innerWidth * 0.3) {
        deltaPage += 1;
    } else if (touchX > innerWidth * 0.7) {
        deltaPage -= 1;
    } else {
        return;
    }

    scrollPagesBy(deltaPage);
});

addEventListener("scroll", function () {
    if (fileDisplay.currentChapter) {
        fileDisplay.currentChapter.loadFilesUpTo(document.documentElement.scrollTop);
    }
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

/** @type {import("./libs/pdfjs-2.12.313-dist/build/pdf.js")} */
let pdfJS;

/**
 * Terribly hacky function to import PDF.js in the browser without
 * external libraries
 */
async function loadPDFJS() {
    window.exports = {}
    // @ts-ignore
    window.module = {};
    await import("./libs/pdfjs-2.12.313-dist/build/pdf.js");
    delete window.exports;
    pdfJS = module.exports;
    delete window.module;

    pdfJS.GlobalWorkerOptions.workerSrc = "./libs/pdfjs-2.12.313-dist/build/pdf.worker.js";
}

{
    /** @type {FileDirectory} */
    let rootDirectory;

    const loadingFilesMap = new Map();
    let loadingFilesMapCurrId = 0;

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
            let str = command;
            if (message) {
                str += ":" + JSON.stringify(message);
            }
            // @ts-ignore
            event.source.postMessage(str, event.origin);
        }

        switch (command) {
            case "enableEmbedMode":
                rootDirectory = new FileDirectory();
                returnMessage("getDirectory");
                break;

            case "setDirectory":
                if (!argument) { break; }

                const directories = argument.directories;
                const directoriesKeys = Object.keys(directories);

                for (const directoryKey of directoriesKeys) {
                    const directory = directories[directoryKey];

                    const start = directory.start === undefined ? 1 : directory.start;
                    for (let i = start; i <= directory.end; i++) {
                        rootDirectory.addBlob(directoryKey + "/" + i.toString(), new LoadableFile(() => new Promise(res => {
                            const returnId = loadingFilesMapCurrId++;

                            loadingFilesMap.set(returnId, res);
                            returnMessage("getPageSrc", {
                                returnId: returnId,
                                directory: directoryKey,
                                page: i
                            });
                        })));
                    }
                }


                updateFiles(rootDirectory);
                break;

            case "setPageSrc":
                if (!argument) { break; }
                const { returnId, src } = argument;
                const promRes = loadingFilesMap.get(returnId);
                if (promRes) {
                    promRes(fetch(src).then(e => e.blob()));
                }
                loadingFilesMap.delete(returnId);
                break;
        }
    });
}
