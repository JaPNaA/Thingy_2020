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
     * @param {Blob} blob
     * @param {string} fileName
     * @param {number} [pageNumber=-1] 
     */
    constructor(parentChapter, blob, fileName, pageNumber) {
        this.parent = parentChapter;
        this.file = blob;
        this.fileName = fileName;
        this.pageNumber = pageNumber === undefined ? -1 : pageNumber;

        this.img = document.createElement("img");
        this.img.classList.add("page");
        this.img.src = URL.createObjectURL(this.file);
        this.img.alt = fileName;

        this.img.addEventListener("dblclick", () => {
            parentChapter.toggleBlankPageBefore(this);
        });
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
            if (!(file instanceof Blob)) { continue; }

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

            for (let j = 0; j < this.pagesPerRow; j++) {
                if (this.pages[i + j]) {
                    rowElm.appendChild(this.pages[i + j].img);
                }
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

class PagesDisplay {
    constructor() {
        /** @type {ChapterFiles[]} */
        this.chapters = [];

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
            this._clearChapterContainer();
            this.chapterContainer.appendChild(chapter.elm);
        });
        this.chapterSelectElm.appendChild(chapterOption);
    }

    _clearChapterContainer() {
        while (this.chapterContainer.firstChild) {
            this.chapterContainer.removeChild(this.chapterContainer.firstChild);
        }
    }
}

class FileDirectory {
    constructor() {
        /** @type {Map<string, Blob | FileDirectory>} */
        this.items = new Map();
        /** @type {string | undefined} */
        this.name = undefined;
        /** @type {string | undefined} */
        this.parentPath = undefined;
    }

    /** @param {File} file */
    addFile(file) {
        /** @type {string} */ // @ts-ignore
        const path = file.webkitRelativePath;

        this.addBlob(path, file);
    }

    /**
     * @param {string} path 
     * @param {Blob} blob 
     */
    addBlob(path, blob) {
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

        currDirectory.items.set(fileName, blob);
    }
}

const main = document.createElement("div");
main.classList.add("main");

const pagesDisplay = new PagesDisplay();
main.appendChild(pagesDisplay.elm);

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
        directory.addFile(file);
    }

    updateFiles(directory);
});

zipFileInput.addEventListener("change", async function (e) {
    await loadJSZip();
    const zip = new JSZip();
    await zip.loadAsync(zipFileInput.files[0]);

    const directory = new FileDirectory();

    if (!isIOS()) {
        let total = 0;
        let loaded = 0;

        zip.forEach(async function (relPath, file) {
            total++;
            const blob = await file.async("blob");
            directory.addBlob(relPath, blob);
            loaded++;
            await checkDoneCallback();
        });

        async function checkDoneCallback() {
            if (loaded >= total) {
                updateFiles(directory);
            }

            if (loaded % 20 === 0) { // loading indication + prevent 'not responding'
                document.body.appendChild(
                    document.createTextNode(Math.round(loaded / total * 100) + "% loaded. ")
                );
                await new Promise(e => setTimeout(() => e(), 1));
            }
        }
    } else {
        // slower, but doesn't crash iOS
        const files = [];

        zip.forEach((relPath, file) => {
            files.push([relPath, file]);
        });

        const batchSize = 10;

        for (let i = 0; i < files.length; i += batchSize) {
            const promises = [];

            for (let j = 0; j < batchSize; j++) {
                const index = i + j;
                if (index >= files.length) { break; }

                const [relPath, file] = files[index];

                promises.push(
                    file.async("blob")
                        .then(blob => directory.addBlob(relPath, blob))
                        .then(() => document.body.appendChild(document.createTextNode(relPath + " loaded. ")))
                );
            }

            await Promise.all(promises);
            await new Promise(e => setTimeout(() => e(), 1));
        }

        updateFiles(directory);
    }
});

function isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

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
                pagesDisplay.addChapter(chapterFiles, currDir.parentPath + currDir.name);
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

    // document.documentElement.scrollTop = currentChapter.closestRowY(newScroll);
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

