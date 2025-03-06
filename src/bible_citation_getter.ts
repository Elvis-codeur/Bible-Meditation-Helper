import { pluginCallout, defaultCitationFolder } from "./constants";
import { Notice, TFile } from "obsidian";

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

        let bible_version = text.split("||")[1];



        // Parse the citation
        // Remove all sapce to facilitate parsing 
        let citation = text.split("||")[0].replace(" ", "").toLowerCase().replace("\n", "").replace("\r", "").split(":");
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

        book = this.mapbookToBookNameInFolder(book);
        book = this.mapBookToOrder(book) + "_" + book;


        // Read the chapter containing the citation

        let result = await this.readCitationOnDrive(book.replace(" ", ""), parseInt(chapter),
            parseInt(verse_indice_inf),
            parseInt(verse_indice_sup), bible_version);


        // Create the citation and put it in a div 
        let chapter_verses = (await result.result).split("\n");

        // To remove the chapter definition line 
        chapter_verses = chapter_verses.slice(1)

        chapter_verses = this.splitTextByNumberedPattern(chapter_verses.join("\n"));


        let citation_indice_begin = parseInt(verse_indice_inf);
        let citation_indice_end = 0;

        if (verse_indice_sup == "") {
            if (book_and_chapter.endsWith("-")) {
                citation_indice_end = chapter_verses.length;
            }
            else {
                citation_indice_end = citation_indice_begin +1;
            }
        }
        else {
            citation_indice_end = parseInt(verse_indice_sup);

        }

        console.log("Citation begin: " + citation_indice_begin);
        console.log("Citation end: " + citation_indice_end);

        console.log("Bible version: " + bible_version);

        let verses_list = [];

        console.log(chapter_verses);


        for (let compteur = 0; compteur < chapter_verses.length; compteur++) {
            let line = chapter_verses[compteur];

            let verse_number = 0;
            if (line.contains(".")) {
                // Take the number of the verse at the begening of the verse 
                verse_number = parseInt(line.slice(0, line.indexOf(".")));

                if (verse_number >= citation_indice_begin && verse_number < citation_indice_end) {
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
        const citationFileNameWithoutExt = this.prepare_book_and_chapter_for_citation(book_and_chapter, citation_indice_begin, citation_indice_end);

        const citationFileName = citationFileNameWithoutExt + ".md";

        const file = await this.createFileInSubfolder(defaultCitationFolder, citationFileName);

        const divContent = `>${pluginCallout}  [[${file.path.split('/').pop()?.replace(/\.md$/, "")}|${citationFileNameWithoutExt + ' | ' + bible_version.trim().toUpperCase()}]]\n`
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


        return `${this.mapbookToBookNameInFolder(book)} ${chapter} : ${verse_indice_inf}-${verse_indice_sup}`;
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
        return fileName.replace(/[\/*?"<>|]/g, "").replace(":", "*"); // Remove forbidden characters
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
            return file;
        }
    }






    mapbookToBookNameInFolder(book: string): string {

        //console.log("Book given : " + book);
        const abbreviations: { [key: string]: string } = {
            "gen": "Genesis",
            "ex": "Exodus",
            "lev": "Leviticus",
            "num": "Numbers",
            "deut": "Deuteronomy",
            "josh": "Joshua",
            "judg": "Judges",
            "ruth": "Ruth",

            "1sam": "I_Samuel",
            "isam": "I_Samuel",
            "2sam": "II_Samuel",
            "iisam": "II_Samuel",
            "1kgs": "I_Kings",
            "ikgs": "I_Kings",
            "2kgs": "II_Kings",
            "iikgs": "II_Kings",
            "1chr": "I_Chronicles",
            "ichr": "I_Chronicles",
            "2chr": "II_Chronicles",
            "iichr": "II_Chronicles",

            "ezra": "Ezra",
            "neh": "Nehemiah",
            "esth": "Esther",
            "job": "Job",
            "ps": "Psalms",
            "prov": "Proverbs",
            "eccl": "Ecclesiastes",
            "song": "Song_of_Solomon",
            "isa": "Isaiah",
            "jer": "Jeremiah",
            "lam": "Lamentations",
            "ezek": "Ezekiel",
            "dan": "Daniel",
            "hos": "Hosea",
            "joel": "Joel",
            "amos": "Amos",
            "obad": "Obadiah",
            "jonah": "Jonah",
            "mic": "Micah",
            "nah": "Nahum",
            "hab": "Habakkuk",
            "zeph": "Zephaniah",
            "hag": "Haggai",
            "zech": "Zechariah",
            "mal": "Malachi",
            "matt": "Matthew",
            "mark": "Mark",
            "luke": "Luke",
            "john": "John",
            "acts": "Acts",
            "rom": "Romans",

            "1cor": "I_Corinthians",
            "icor": "I_Corinthians",
            "2cor": "II_Corinthians",
            "iicor": "II_Corinthians",

            "gal": "Galatians",
            "eph": "Ephesians",
            "phil": "Philippians",
            "col": "Colossians",

            "1thess": "I_Thessalonians",
            "ithess": "I_Thessalonians",
            "2thess": "II_Thessalonians",
            "iithess": "II_Thessalonians",
            "1tim": "I_Timothy",
            "itim": "I_Timothy",
            "2tim": "II_Timothy",
            "iitim": "II_Timothy",

            "titus": "Titus",
            "phlm": "Philemon",
            "heb": "Hebrews",
            "jas": "James",

            "1pet": "I_Peter",
            "ipet": "I_Peter",
            "2pet": "II_Peter",
            "iipet": "II_Peter",
            "1john": "I_John",
            "ijohn": "I_John",
            "2john": "II_John",
            "iijohn": "II_John",
            "3john": "III_John",
            "iiijohn": "III_John",

            "jude": "Jude",
            "rev": "Revelation",

            "genèse": "Genesis",
            "exode": "Exodus",
            "lévitique": "Leviticus",
            "nombres": "Numbers",
            "deutéronome": "Deuteronomy",
            "josué": "Joshua",
            "juges": "Judges",
            "1samuel": "I_Samuel",
            "isamuel": "I_Samuel",
            "2samuel": "I_Samuel",
            "iisamuel": "II_Samuel",

            "1rois": "I_Kings",
            "irois": "I_Kings",
            "2rois": "II_Kings",
            "iirois": "II_Kings",

            "1chroniques": "I_Chronicles",
            "ichroniques": "I_Chronicles",
            "2chroniques": "II_Chronicles",
            "iichroniques": "II_Chronicles",

            "esdras": "Ezra",
            "néhémie": "Nehemiah",
            "esther": "Esther",
            "psaumes": "Psalms",
            "proverbes": "Proverbs",
            "ecclésiaste": "Ecclesiastes",
            "cantique": "Song_of_Solomon",
            "ésaïe": "Isaiah",
            "jérémie": "Jeremiah",
            "lamentations": "Lamentations",
            "ézéchiel": "Ezekiel",
            "daniel": "Daniel",
            "osée": "Hosea",
            "joël": "Joel",
            "abdias": "Obadiah",
            "jonas": "Jonah",
            "michée": "Micah",
            "nahum": "Nahum",
            "habacuc": "Habakkuk",
            "sophonie": "Zephaniah",
            "aggée": "Haggai",
            "zacharie": "Zechariah",
            "malachie": "Malachi",
            "matthieu": "Matthew",
            "marc": "Mark",
            "luc": "Luke",
            "jean": "John",
            "actes": "Acts",
            "romains": "Romans",

            "1corinthiens": "I_Corinthians",
            "icorinthiens": "I_Corinthians",
            "2corinthiens": "II_Corinthians",
            "iicorinthiens": "II_Corinthians",

            "galates": "Galatians",
            "éphésiens": "Ephesians",
            "philippiens": "Philippians",
            "colossiens": "Colossians",

            "1thessaloniciens": "I_Thessalonians",
            "ithessaloniciens": "I_Thessalonians",
            "2thessaloniciens": "II_Thessalonians",
            "iithessaloniciens": "II_Thessalonians",
            "1timothée": "I_Timothy",
            "itimothée": "I_Timothy",
            "2timothée": "II_Timothy",
            "iitimothée": "II_Timothy",


            "tite": "Titus",
            "philémon": "Philemon",
            "hébreux": "Hebrews",
            "jacques": "James",

            "1pierre": "I_Peter",
            "ipierre": "I_Peter",
            "2pierre": "II_Peter",
            "iipierre": "II_Peter",
            "1jean": "I_John",
            "ijean": "I_John",
            "2jean": "II_John",
            "iijean": "II_John",
            "3jean": "III_John",
            "iiijean": "III_John",

            "apocalypse": "Revelation",


            "genesis": "Genesis",
            "exodus": "Exodus",
            "leviticus": "Leviticus",
            "numbers": "Numbers",
            "deuteronomy": "Deuteronomy",
            "joshua": "Joshua",
            "judges": "Judges",
            //"ruth": "Ruth",
            //"1samuel": "I_Samuel",
            //"2samuel": "II_Samuel",

            "1kings": "I_Kings",
            "ikings": "I_Kings",
            "2kings": "II_Kings",
            "iikings": "II_Kings",
            "1chronicles": "I_Chronicles",
            "ichronicles": "I_Chronicles",
            "2chronicles": "II_Chronicles",
            "iichronicles": "II_Chronicles",

            //"ezra": "Ezra",
            "nehemiah": "Nehemiah",
            //"esther": "Esther",
            //"job": "Job",
            "psalms": "Psalms",
            "proverbs": "Proverbs",
            "ecclesiastes": "Ecclesiastes",
            "songofsolomon": "Song_of_Solomon",
            "isaiah": "Isaiah",
            "jeremiah": "Jeremiah",
            //"lamentations": "Lamentations",
            "ezekiel": "Ezekiel",
            //"daniel": "Daniel",
            "hosea": "Hosea",
            //"joel": "Joel",
            //"amos": "Amos",
            "obadiah": "Obadiah",
            //"jonah": "Jonah",
            "micah": "Micah",
            //"nahum": "Nahum",
            "habakkuk": "Habakkuk",
            "zephaniah": "Zephaniah",
            "haggai": "Haggai",
            "zechariah": "Zechariah",
            "malachi": "Malachi",
            "matthew": "Matthew",
            //"mark": "Mark",
            //"luke": "Luke",
            //"john": "John",
            //"acts": "Acts",
            "romans": "Romans",

            "1corinthians": "I_Corinthians",
            "icorinthians": "I_Corinthians",
            "2corinthians": "II_Corinthians",
            "iicorinthians": "II_Corinthians",

            "galatians": "Galatians",
            "ephesians": "Ephesians",
            "philippians": "Philippians",
            "colossians": "Colossians",

            "1thessalonians": "I_Thessalonians",
            "ithessalonians": "I_Thessalonians",
            "2thessalonians": "II_Thessalonians",
            "iithessalonians": "II_Thessalonians",
            "1timothy": "I_Timothy",
            "itimothy": "I_Timothy",
            "2timothy": "II_Timothy",
            "iitimothy": "II_Timothy",

            //"titus": "Titus",
            "philemon": "Philemon",
            "hebrews": "Hebrews",
            "james": "James",

            "1peter": "I_Peter",
            "ipeter": "I_Peter",
            "2peter": "II_Peter",
            "iipeter": "II_Peter",

            "revelation": "Revelation"

        };
        return abbreviations[book.replace(" ", "").trim()] || "Unknown";
    }


    mapBibleVersionToLanguage(bible_version: string): string {
        console.log("Bible version: == == == " + bible_version);
        const language: { [key: string]: string } = {
            "ESV": "en",
            "NIV": "en",
            "KJV": "en",
            "NLT": "en",
            "NRSV": "en",
            "RSV": "en",
            "NASB": "en",
            "ASV": "en",
            "WEB": "en",
            "BBE": "en",
            "DARBY": "en",
            "HNV": "en",
            "WBT": "en",
            "WNT": "en",
            "YLT": "en",
            "RVR1960": "es",
            "LBLA": "es",
            "NVI": "es",
            "RVR1977": "es",
            "RVR1995": "es",
            "TLA": "es",
            //"NVI-PT": "pt",
            "ARC": "pt",
            "ARA": "pt",
            "NVI-PT": "pt",
            "LSG": "fr",
            "LSG10": "fr",
            "NEG": "fr",
            "PDV": "fr",
            "BDS": "fr"
        };
        return language[bible_version.toUpperCase().trim() as keyof typeof language] || "None";

    }



    mapBookToOrder(book: string): string {
        const bookOrder: { [key: string]: number } = {
            "Genesis": 0,
            "Exodus": 1,
            "Leviticus": 2,
            "Numbers": 3,
            "Deuteronomy": 4,
            "Joshua": 5,
            "Judges": 6,
            "Ruth": 7,
            "I_Samuel": 8,
            "II_Samuel": 9,
            "I_Kings": 10,
            "II_Kings": 11,
            "I_Chronicles": 12,
            "II_Chronicles": 13,
            "Ezra": 14,
            "Nehemiah": 15,
            "Esther": 16,
            "Job": 17,
            "Psalms": 18,
            "Proverbs": 19,
            "Ecclesiastes": 20,
            "Song_of_Solomon": 21,
            "Isaiah": 22,
            "Jeremiah": 23,
            "Lamentations": 24,
            "Ezekiel": 25,
            "Daniel": 26,
            "Hosea": 27,
            "Joel": 28,
            "Amos": 29,
            "Obadiah": 30,
            "Jonah": 31,
            "Micah": 32,
            "Nahum": 33,
            "Habakkuk": 34,
            "Zephaniah": 35,
            "Haggai": 36,
            "Zechariah": 37,
            "Malachi": 38,
            "Matthew": 39,
            "Mark": 40,
            "Luke": 41,
            "John": 42,
            "Acts": 43,
            "Romans": 44,
            "I_Corinthians": 45,
            "II_Corinthians": 46,
            "Galatians": 47,
            "Ephesians": 48,
            "Philippians": 49,
            "Colossians": 50,
            "I_Thessalonians": 51,
            "II_Thessalonians": 52,
            "I_Timothy": 53,
            "II_Timothy": 54,
            "Titus": 55,
            "Philemon": 56,
            "Hebrews": 57,
            "James": 58,
            "I_Peter": 59,
            "II_Peter": 60,
            "I_John": 61,
            "II_John": 62,
            "III_John": 63,
            "Jude": 64,
            "Revelation": 65
        };

        let chapterString = "";

        let chapterNUmber = (bookOrder[book] ?? -1) + 1;

        if (chapterNUmber < 10) {
            chapterString = "0" + chapterNUmber.toString();
        }
        else {
            chapterString = chapterNUmber.toString();
        }
        return chapterString;
    }
}

