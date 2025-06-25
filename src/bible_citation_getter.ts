import { pluginCallout, defaultCitationFolder, mapBibleBookAbbrevToBibleBooks, mapBibleVersionToLanguage, mapBibleBookToNumericalOrder } from "./constants";
import { Notice, TFile } from "obsidian";
import { CalloutBlock } from "./type_definitions";
import { findClosestBookName } from "./text_manipulations";
import exp from "constants";

const path = require("path");


function isInteger(str: string) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(parseInt(str))
}

export default class BibleCitationGetter {
    vault: any;
    app: any;
    constructor({ app }: { app: any; }) {
        this.app = app;;

        this.vault = app.vault;

    }

    splitTextByNumberedPattern(text: string): string[] {
        return text.split(/(?=\b\d+\.\s)/g);
    }


    async getCitation(text: string): Promise<{ citation: string, result: any }> {

        console.log("getCitation -- ", text)

        let inputTextSplited = text.split("||");
        let bible_version = "";
        if (inputTextSplited.length > 1) {
            bible_version = inputTextSplited[1];

        }
        else {
            new Notice("Aucune version de la Bible n'a été choisi", 3000);
            throw Error("Aucune version de la Bible n'a été choisi")
        }



        // Parse the citation
        // Remove all sapce to facilitate parsing 
        let citation = inputTextSplited[0].replace(" ", "").toLowerCase().replace("\n", "").replace("\r", "").split(":");
        let book_and_chapter = citation[0];

        let book = "";
        let chapter = "";

        for (let i = 0; i < book_and_chapter.length; i++) {
            if (isInteger(book_and_chapter[i]) && i != 0) { // Check because of 1 John, 1 Samuel, etc
                book = book_and_chapter.substring(0, i);
                chapter = book_and_chapter.substring(i, book_and_chapter.length);
                break
            }
        }

        let verse_indice_inf = citation[1].split("-")[0];
        let verse_indice_sup = citation[1].split("-").length > 1 ? citation[1].split("-")[1] : "";


        //console.log("Book: " + book);
        //console.log("Chapter: " + chapter);
        //console.log("Verse inf: " + verse_indice_inf);
        //console.log("Verse sup: " + verse_indice_sup);



        let bookNameInFolder = this.mapbookToBookNameInFolder(book);

        // If the book is not found, use levenshtein function to search for the neearest one 

        if (bookNameInFolder == "Unknown") {
            // Find the closes Book 
            let Levenshtein_Book = findClosestBookName(book, [...mapBibleBookAbbrevToBibleBooks.keys()]) || ""

            console.log("Levenshtein function used ", book, Levenshtein_Book)
            book = Levenshtein_Book;


            if (book) {

                bookNameInFolder = this.mapbookToBookNameInFolder(book);
            }
            else {

                new Notice(`The book is "${book}" not in the Bible. Check for the spelling perhaps`, 1e4)
                throw Error(`The book is "${book}" not in the Bible. Check for the spelling perhaps`)

            }

        }

        bookNameInFolder = this.mapBookToOrder(bookNameInFolder) + "_" + bookNameInFolder;


        // Read the chapter containing the citation

        let result = await this.readCitationOnDrive(bookNameInFolder.replace(" ", ""), parseInt(chapter),
            parseInt(verse_indice_inf),
            parseInt(verse_indice_sup), bible_version);


        // Create the citation and put it in a div 
        let chapter_verses = (await result.result).split("\n");

        // To remove the chapter definition line 
        chapter_verses = chapter_verses.slice(1)

        chapter_verses = this.splitTextByNumberedPattern(chapter_verses.join("\n"));


        let citation_indice_begin = parseInt(verse_indice_inf);
        let citation_indice_end = 0;

        //console.log(book_and_chapter);

        if (verse_indice_sup == "") {
            if (citation[1].trim().at(-1) == "-") {
                citation_indice_end = chapter_verses.length;
            }
            else {
                citation_indice_end = citation_indice_begin;
            }
        }
        else {
            citation_indice_end = parseInt(verse_indice_sup);

        }

        console.log("Citation begin: " + citation_indice_begin);
        console.log("Citation end: " + citation_indice_end);

        console.log("Bible version: " + bible_version);

        let verses_list = [];

        //console.log(chapter_verses);


        for (let compteur = 0; compteur < chapter_verses.length; compteur++) {
            let line = chapter_verses[compteur];

            let verse_number = 0;
            if (line.contains(".")) {
                // Take the number of the verse at the begening of the verse 
                verse_number = parseInt(line.slice(0, line.indexOf(".")));

                if (verse_number >= citation_indice_begin && verse_number <= citation_indice_end) {
                    verses_list.push(
                        {
                            number: verse_number,
                            text: line.slice(line.indexOf(".") + 1, -1).trimEnd() // I add 1 to avoid the .
                        }
                    )

                }
            }

        }


        //const verses = this.splitVersesFromMarkdown(markdownText);
        //console.log(verses);

        // The name of the citation file without its extension
        let citationFileNameWithoutExt = this.prepare_book_and_chapter_for_citation(book_and_chapter, citation_indice_begin, citation_indice_end);

        if (citationFileNameWithoutExt.toLowerCase().contains("revelation_of_john")) {
            citationFileNameWithoutExt = citationFileNameWithoutExt.replace("Revelation_of_John", "Revelation")
        }

        const citationFileName = citationFileNameWithoutExt + ".md";

        const file = await this.createFileInSubfolder(defaultCitationFolder, citationFileName);

        const divContent = `>${pluginCallout}  [[${file.path.split('/').pop()?.replace(/\.md$/, "")}|${citationFileNameWithoutExt.replace("_", " ") + ' | ' + bible_version.trim().toUpperCase()}]]\n`
            + verses_list.map((value) => {
                return `>**${value.number}** ${value.text}\n`
            }).join("");

        // const divContent = `<div class="bible-citation">

        //     <div>

        //     <div class = "scripture_quoted" >${this.prepare_book_and_chapter_for_citation(book_and_chapter,citation_indice_begin,citation_indice_end)} </div>

        //     <div class="bible_version_section_div">
        //         <label for="myDropdown">Choose an option:</label>
        // 		<select id="select_bible_version_dropdown">
        // 			<option value="option1">ESV</option>
        // 			<option value="option2">KJV</option>
        // 			<option value="option3">LSG10</option>
        // 		</select>

        //     </div>

        //     </div>

        //     <div class="citation-content">${verses_list.map((value) => {
        //     return `<div><p> <b> ${value.number} </b> ${value.text} </p></div>`
        // }).join("")}</div>
        // </div>`;


        return { citation: divContent, result: result };


    }


    async createFileForCitation(book: string, chapter: string, verse_indice_inf: number, verse_indice_sup: number, version: string): Promise<string | null> {

        const fileName = `${book} ${chapter}:${verse_indice_inf}-${verse_indice_sup}.md`;

        const file = await this.createFile(fileName, "");

        if (file) {
            const link = this.generateLink(file);
            this.vault.app.workspace.activeLeaf?.setViewState({
                type: 'markdown',
                state: { file: file.path },
            });
            new Notice(`Created file with citation: ${book} ${chapter}:${verse_indice_inf}-${verse_indice_sup}`);
            return link;
        }
        return null;
    }



    async createFile(fileName: string, content: string): Promise<TFile | null> {
        try {
            const file = await this.app.vault.create(fileName, content);
            return file;
        } catch (error) {
            console.error("Failed to create file:", error);
            new Notice("Failed to create file.");
            return null;
        }
    }

    getFilePath(file: TFile): string {
        return `[[${file.path}]]`;
    }
    generateLink(file: TFile): string {
        return `[[${file.path.split('/').pop()?.replace(/\.md$/, "")}]]`;
    }



    prepare_book_and_chapter_for_citation(book_and_chapter: string,
        verse_indice_inf: number,
        verse_indice_sup: number) {

        // Prepare the name of the book 
        let result = "";
        if (isInteger(book_and_chapter.charAt(0))) {
            result = book_and_chapter.charAt(0) + " " +
                book_and_chapter.charAt(1).toUpperCase() + book_and_chapter.slice(2);
        }
        else {
            if (book_and_chapter.charAt(0) == "i") {
                result = book_and_chapter.charAt(0).toUpperCase() + " " +
                    book_and_chapter.charAt(1).toUpperCase() + book_and_chapter.slice(2);

            }
            else if (book_and_chapter.slice(0, 2) == "ii") {
                result = book_and_chapter.slice(0, 2).toUpperCase() + " " +
                    book_and_chapter.charAt(2).toUpperCase() + book_and_chapter.slice(3);
            }
            else if (book_and_chapter.slice(0, 3) == "iii") {
                result = book_and_chapter.slice(0, 3).toUpperCase() + " " +
                    book_and_chapter.charAt(3).toUpperCase() + book_and_chapter.slice(4);
            }
            else {
                result = book_and_chapter.charAt(0).toUpperCase() + book_and_chapter.slice(1);
            }

        }

        // Separate the name of the book from the chapter 
        let book = "";
        let chapter = "";
        for (let i = 0; i < book_and_chapter.length; i++) {
            if (isInteger(book_and_chapter[i]) && i != 0) { // Check because of 1 John, 1 Samuel, etc
                book = book_and_chapter.substring(0, i);
                chapter = book_and_chapter.substring(i, book_and_chapter.length);
                break
            }
        }

        // Cas de citation d'un seul verset
        if (verse_indice_inf == verse_indice_sup) {
            return `${this.mapbookToBookNameInFolder(book)} ${chapter}:${verse_indice_inf}`;
        }
        else {
            return `${this.mapbookToBookNameInFolder(book)} ${chapter}:${verse_indice_inf}-${verse_indice_sup}`;
        }

    }

    convert_number_to_string(number: number): string {
        if (number < 10) {
            return "0" + number.toString();
        }
        else {
            return number.toString();
        }
    }

    // Method to get a citation by book, chapter, and verse
    async readCitationOnDrive(book: string, chapter: number, verse_indice_inf: number,
        verse_indice_sup: number, bible_version: string) {


        let language: string = this.mapBibleVersionToLanguage(bible_version);
        let chapterString;

        if (chapter < 10) {
            chapterString = "0" + chapter;
        }
        else {
            chapterString = chapter.toString();
        }


        let chapterName = `Chapter_${chapterString}.md`;

        let filepath = `data/Bible/${language}/${bible_version.toUpperCase()}/by_chapter/${book}/${chapterName}`;

        filepath = path.join(this.vault.configDir, "plugins", "Bible-Meditation-Helper", filepath);

        let result = await this.vault.adapter.read(filepath)

        //console.log("Result: " + result);

        return {
            "result": result, language: language.toLocaleLowerCase(),
            bible_version: bible_version.toUpperCase(), chapter: chapterName,
            book: book, verse_indice_inf: verse_indice_inf, verse_indice_sup: verse_indice_sup
        };
    }

    // Helper function to remove invalid filename characters
    sanitizeFileName(fileName: string): string {
        return fileName.replace(/[\/*?"<>|]/g, "").replace(":", "_")
    }

    async createFileInSubfolder(folderPath: string, fileName: string, content: string = "") {
        const vault = this.app.vault;

        // Ensure the folder exists, create it if it doesn’t
        const folder = vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await vault.createFolder(folderPath);
            console.log(`Folder created: ${folderPath}`);
        }

        // Sanitize the file name
        const safeFileName = this.sanitizeFileName(fileName);
        const filePath = `${folderPath}/${safeFileName}`;

        const file = vault.getAbstractFileByPath(filePath);
        // Check if the file exists before creating
        if (!file) {
            const file = await vault.create(filePath, content);
            return file;
        } else {
            //console.log("citation file exists")
            return file;
        }
    }






    mapbookToBookNameInFolder(book: string): string {

        //console.log("Book given : " + book);

        return mapBibleBookAbbrevToBibleBooks.get(book.replace(" ", "").trim()) || "Unknown";

    }



    mapBibleVersionToLanguage(bible_version: string): string {
        console.log("Bible version: == == == " + bible_version);

        return mapBibleVersionToLanguage.get(bible_version.toUpperCase().trim()) || "None";

    }


    mapBookToOrder(book: string) {

        let chapterString = "";

        let chapterNUmber = (mapBibleBookToNumericalOrder.get(book) ?? -1) + 1;

        if (chapterNUmber < 10) {
            chapterString = "0" + chapterNUmber.toString();
        }
        else {
            chapterString = chapterNUmber.toString();
        }
        return chapterString;
    }
}

// Helper to get character offset from line number
function getLineOffset(text: string, lineNumber: number): number {
    const lines = text.split('\n');
    return lines
        .slice(0, lineNumber)
        .reduce((offset, line) => offset + line.length + 1, 0); // +1 for newline
}



function findCalloutsWithIndices(markdown: string): CalloutBlock[] {
    const lines = markdown.split('\n');
    const results: CalloutBlock[] = [];

    let insideCallout = false;
    let calloutStartLine = 0;
    let currentCalloutLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!insideCallout) {
            // Detect callout start line: >[!type] Optional text
            if (/^\s{0,3}>\s*\[!\w+.*?\]/.test(line)) {
                insideCallout = true;
                calloutStartLine = i;
                currentCalloutLines = [line];
            }
        } else {
            // Continue collecting lines starting with >
            if (/^\s{0,3}>\s?.*/.test(line)) {
                currentCalloutLines.push(line);
            } else {
                // End of callout
                const startIndex = getLineOffset(markdown, calloutStartLine);
                const endIndex = getLineOffset(markdown, i);
                results.push({
                    text: currentCalloutLines.join('\n'),
                    startIndex,
                    endIndex
                });
                insideCallout = false;
            }
        }
    }

    // If file ends during a callout
    if (insideCallout) {
        const startIndex = getLineOffset(markdown, calloutStartLine);
        results.push({
            text: currentCalloutLines.join('\n'),
            startIndex,
            endIndex: markdown.length
        });
    }

    return results;
}

function findCallouts(content: string) {
    const calloutRegex = /^> \[!(\w+)\][^\n]*([\s\S]*?)(?=\n(?!> )|$)/gm;
    let match;
    const results = [];

    while ((match = calloutRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        results.push({
            calloutType: match[1],          // e.g. NOTE, WARNING, etc.
            text: fullMatch.trim(),
            startIndex: startIndex,
            endIndex: endIndex
        });
    }

    return results
}



export async function convertPlainCitationsToPluggingCitationsInText(content: string, newBibleCitationVersion: string) {

    // STEP 1: Abbreviations for books (English + French, partial for demo)
    const books = [
        "Gen(?:esis)?", "Ex(?:odus)?", "Lev(?:iticus)?", "Rom(?:ains)?", "1 ?(Cor|Corinthiens?)", "2 ?(Cor|Corinthiens?)",
        "Jean", "John", "Matthieu", "Matthew", "Marc", "Mark", "Luc", "Luke", "Ésaïe", "Isa(?:iah)?",
        "Ps(?:aumes|alms)?", "Prov(?:erbes|erbs)?", "Apoc(?:alypse)?", "Rev(?:elation)?"
    ];

    // STEP 2: Build a regex from those books
    //const bookRegex = books.join("|");

    // STEP 3: Main pattern - find Book + chapter:verse
    //const bibleRegex = new RegExp(`\\b(?:${bookRegex})\\s+\\d{1,3}(?::\\d{1,3}(?:[-–]\\d{1,3})?)?\\b`, "gi");

    //const regex = /\b(?:[1-3]?\s?[A-Za-zÀ-ÿ]+(?:\s?[A-Za-zÀ-ÿ]+)*)(?:\s?\d{1,3}(:\d{1,3})?(?:-\d{1,3}(:\d{1,3})?)?)\b/g;

    const BibleCitaionRegex = /\b(?:[1-3]?\s?[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿa-zà-ÿ]+)*)(?:\s+\d{1,3}(?::\d{1,3})?(?:-\d{1,3})?)\b/g;

    //const regex = /\b(?:1\s?Sam|2\s?Sam|1\s?Rois|2\s?Rois|1\s?Chroniques|2\s?Chroniques|Esdras|Néhémie|Esther|Job|Psaumes?|Proverbes|Ecclésiaste|Cantique\s?des\s?Cantiques|Isaïe|Jérémie|Lamentations|Ézéchiel|Daniel|Osée|Joël|Amos|Abdias|Jonas|Michée|Nahum|Habacuc|Sophonie|Aggée|Zacharie|Malachie|Matthieu|Marc|Luc|Jean|Actes|Romains|1\s?Corinthiens|2\s?Corinthiens|Galates|Éphésiens|Philippiens|Colossiens|1\s?Thessaloniciens|2\s?Thessaloniciens|1\s?Timothée|2\s?Timothée|Tite|Philémon|Hébreux|Jacques|1\s?Pierre|2\s?Pierre|1\s?Jean|2\s?Jean|3\s?Jean|Jude|Apocalypse|Gen|Ex|Lv|Nb|Dt|Jos|Jg|Rt|1\s?S|2\s?S|1\s?R|2\s?R|1\s?Ch|2\s?Ch|Esd|Néh|Est|Jb|Ps|Pr|Eccl|Cant|Is|Jr|Lm|Ez|Dn|Os|Jl|Am|Ab|Jon|Mi|Na|Hab|So|Ag|Za|Mal|Mt|Mc|Lc|Jn|Ac|Rm|1\s?Co|2\s?Co|Ga|Ep|Ph|Co|1\s?Th|2\s?Th|1\s?Ti|2\s?Ti|Tt|Phm|He|Jc|1\s?Pi|2\s?Pi|1\s?Jn|2\s?Jn|3\s?Jn|Jd|Ap|Gn|Ex|Lv|Nb|Dt|Jos|Jg|Rt|1\s?S|2\s?S|1\s?R|2\s?R|1\s?Ch|2\s?Ch|Esd|Néh|Est|Jb|Ps|Pr|Eccl|Cant|Is|Jr|Lm|Ez|Dn|Os|Jl|Am|Ab|Jon|Mi|Na|Hab|So|Ag|Za|Mal|Mt|Mc|Lc|Jn|Ac|Rm|1\s?Co|2\s?Co|Ga|Ep|Ph|Co|1\s?Th|2\s?Th|1\s?Ti|2\s?Ti|Tt|Phm|He|Jc|1\s?Pi|2\s?Pi|1\s?Jn|2\s?Jn|3\s?Jn|Jd|Ap)\s*\d{1,3}\s*:?\s*\d{1,3}(?:\s*-\s*\d{1,3})?\b/g;


    // Given that I don't find any satisfactory algorithm to find the callouts, I will use a code 
    // where I do not separate callout from normal text


    let result: string[] = [];

    for (var line of content.split("\n")) {
        if (!(line.startsWith(">") || line.startsWith("-") || line.startsWith("+"))) {
            if (line.match(BibleCitaionRegex)) {

                try {
                    console.log(line)

                    result.push(await ((await new
                        BibleCitationGetter({ app: this.app }).getCitation([line, newBibleCitationVersion].join("||"))).citation))

                }
                catch(error){
                    console.log(error);
                    result.push(line);
                }
                
            }
            else {
                result.push(line)
            }
        }
        else {
            result.push(line)
        }
    }

    return result.join("\n")


    /*
    let nonCalloutTextList = [];

    // The list of the new non callout text with the verse inserted if needed 
    let newNonCalloutTextList = [];

    let calloutList = findCallouts(content)

    console.log("calloutList",calloutList);

    if (calloutList.length > 0) {
        // Add a text if it exists before the first callout 
        nonCalloutTextList.push(content.slice(0, calloutList[0].startIndex - 1))

        // Split my text to separate the callouts from the normal text 
        for (var compteur = 1; compteur < calloutList.length; compteur++) {
            nonCalloutTextList.push(content.slice(calloutList[compteur - 1].endIndex, calloutList[compteur].startIndex))
        }

        // Add a text if its exists after the last callout 
        nonCalloutTextList.push(content.slice(calloutList[calloutList.length - 1].endIndex))

    }
    else {
        nonCalloutTextList.push(content)
    }


    var newContentNonCalloutTextList = [];


    for (var nonCalloutText of nonCalloutTextList) {
        // empty the list 
        newContentNonCalloutTextList = [];

        for (var line of nonCalloutText.split("\n")) {
            // If it is not a line of the definition of a callout or not in a callout 
            if (!line.startsWith(">")) {
                if (line.match(BibleCitaionRegex)) {
                    let reference = [line, newBibleCitationVersion].join("||");
                    try {
                        newContentNonCalloutTextList.push((await (new BibleCitationGetter({ app: this.app })).getCitation(reference)).citation + "\n")

                    }
                    // In the case it is not a correct citation
                    catch {
                        newContentNonCalloutTextList.push(line)
                    }
                }
                else {
                    newContentNonCalloutTextList.push(line)
                }
            }
            else {

                newContentNonCalloutTextList.push(line);
            }
        }

        newNonCalloutTextList.push(newContentNonCalloutTextList.join("\n"))

    }


    console.log("nonCalloutTextList", nonCalloutTextList)
    console.log("newNonCalloutTextList", newNonCalloutTextList)


    // Recreate the content of the file now that we have added the verse
    // I interleave the callout text and the non callout text back
    let newFileContent = newNonCalloutTextList[0] ?? '';

    newFileContent = newFileContent;

    for (var i = 0; i < calloutList.length; i++) {
        newFileContent += calloutList[i].text + "\n";
        newFileContent += newNonCalloutTextList[i + 1] + "\n";
    }

    console.log("newFileContent", newFileContent)


    return newFileContent;


    */



}


export async function extractBibleCitations(text: string) {
    const regex = />\[!bible-meditation-helper-citation]\s+\[\[([^\]]+)\]\]\n((?:>.*\n?)*)/g;

    let matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = regex.lastIndex;

        matches.push({
            reference: match[1],
            fullText: match[0], // <-- This now includes the whole matched block
            text: match[2]
                .split('\n')
                .filter(line => line.startsWith('>'))
                .map(line => line.slice(1).trim())
                .join('\n'),
            startIndex,
            endIndex,
        });
    }

    // Sort matches by beginIndex in reverse order to handle nested links correctly
    matches.sort((a, b) => b.startIndex - a.startIndex);

    return matches;
}


export async function changeBibleCitationVersionInText(content: string, newBibleCitationVersion: string) {


    let matches = await extractBibleCitations(content);

    console.log(matches);

    // Note: We reverse the list to avoid breaking indices as we edit from the back to the front.
    let newContent = content;
    for (const result of matches) {

        let newReference = [result.reference.split("|")[1], newBibleCitationVersion].join("||") // Create a new citation reference with the new bible version requisted

        newContent = newContent.slice(0, result.startIndex) +"\n"+
            (await (new BibleCitationGetter({ app: this.app }).getCitation(newReference))).citation + "\n"+
            newContent.slice(result.endIndex);
    }

    return newContent;
}
