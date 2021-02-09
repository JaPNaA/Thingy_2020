// --- Language Loading

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
        });

        this.img.addEventListener("dblclick", () => {
            parentChapter.toggleBlankPageBefore(this);
        });
    }

    async loadFile() {
        this.img.src = URL.createObjectURL(
            await this.loadableFile.loadFile()
        );
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

        this.pagesPerRow = 2;

        /** @type {number[]} */
        this.snapPoints = [];

        this.elm = document.createElement("div");
        this.elm.classList.add("chapter");

        resizeSubscribers.push(() => this.resizeHandler());
        this.resizeHandler();

        this.createAndOrganizePageFiles();
        this.updateElements();
    }

    resizeHandler() {
        const newPagesPerRow = portraitMode ? 1 : 2;
        if (newPagesPerRow != this.pagesPerRow) {
            this.pagesPerRow = newPagesPerRow;
            this.updateElements();
        }

        if (portraitMode) {
            this.elm.classList.add("portrait");
        } else {
            this.elm.classList.remove("portrait");
        }
    }

    createAndOrganizePageFiles() {
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

        this.pages.push(null);

        for (const page of mainPages) {
            this.pages.push(page);
        }
        for (const page of extraPages) {
            this.pages.push(page);
        }
    }

    updateElements() {
        while (this.elm.firstElementChild) { this.elm.removeChild(this.elm.firstElementChild); }

        for (let i = 0; i < this.pages.length; i += this.pagesPerRow) {
            const rowElm = document.createElement("div");
            rowElm.classList.add("row");
            let actualPagesInRow = 0;

            for (let j = 0; j < this.pagesPerRow; j++) {
                if (this.pages[i + j]) {
                    rowElm.appendChild(this.pages[i + j].img);
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
        const yRelative = yPosition - this.elm.offsetTop;

        /** @type {HTMLDivElement} */ // @ts-ignore
        const firstRow = this.elm.firstChild;
        const pageHeight = firstRow.getBoundingClientRect().height + 16; // 16 is margin-bottom
        const approximateRowIndex = Math.round(yRelative / pageHeight);
        /** @type {HTMLDivElement} */ // @ts-ignore
        const row = this.elm.children[approximateRowIndex];

        if (row) {
            return row.offsetTop;
        } else {
            return approximateRowIndex * pageHeight;
        }
    }

    /** @param {PageFile} page */
    toggleBlankPageBefore(page) {
        const index = this.pages.indexOf(page);
        console.log(index);
        if (this.pages[index - 1] === null) {
            this.pages.splice(index - 1, 1);
        } else {
            this.pages.splice(index, 0, null);
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
     * @typedef {(() => Promise<Blob>} FileLoader
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
     * @return {Promise<Blob>}
     */
    async loadFile() {
        if (this.loadedFile) { return this.loadedFile; }
        if (this.loadingPromise) { return this.loadingPromise; }
        this.loadingPromise = this.loader();
        this.loadingPromise.then(blob => this.loadedFile = blob);
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

    /** @param {LoadableFile} file */
    addFile(file) {
        /** @type {string} */ // @ts-ignore
        const path = file.webkitRelativePath;

        this.addBlob(path, file);
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

const main = document.createElement("div");
main.classList.add("main");

const fileDisplay = new FileDisplay();
main.appendChild(fileDisplay.elm);

const directoryFileInput = document.createElement("input");
directoryFileInput.type = "file";
directoryFileInput.multiple = true;
directoryFileInput.setAttribute("webkitdirectory", "true");
directoryFileInput.setAttribute("directory", "true");

const zipFileInput = document.createElement("input");
zipFileInput.type = "file";
zipFileInput.accept = "application/zip";

const filesInputLabelText = document.createElement("span");
langMapProm.then(map => filesInputLabelText.innerText = map.selectMangaFolder);

const directoryFileInputLabel = document.createElement("label");
directoryFileInputLabel.appendChild(filesInputLabelText);
directoryFileInputLabel.appendChild(directoryFileInput);

main.appendChild(directoryFileInputLabel);


const zipFileInputLabelText = document.createElement("span");
langMapProm.then(map => zipFileInputLabelText.innerText = map.selectMangaZip);

const zipFileInputLabel = document.createElement("label");
zipFileInputLabel.appendChild(zipFileInputLabelText);
zipFileInputLabel.appendChild(zipFileInput);

main.appendChild(zipFileInputLabel)

document.body.appendChild(main);


directoryFileInput.addEventListener("change", function (e) {
    langMapProm.then(map => filesInputLabelText.innerText = map.selectAdditionalMangaFolder);

    const directory = new FileDirectory();

    for (const file of directoryFileInput.files) {
        directory.addFile(new LoadableFile(file));
    }

    updateFiles(directory);
});

zipFileInput.addEventListener("change", async function (e) {
    await loadJSZip();
    const zip = new JSZip();
    await zip.loadAsync(zipFileInput.files[0]);

    const directory = new FileDirectory();

    zip.forEach(function (relPath, file) {
        directory.addBlob(relPath,
            new LoadableFile(async () => await file.async("blob"))
        );
    });

    updateFiles(directory);
});

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

    const pageHeight = innerHeight;

    let newScroll = document.documentElement.scrollTop;

    if (goingDown) {
        newScroll += pageHeight;
    } else if (goingUp) {
        newScroll -= pageHeight;
    }

    document.documentElement.scrollTop = fileDisplay.currentChapter.closestRowY(newScroll);
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

