import e from "express";
import { promises as fsPromises } from "fs";
import { version } from "os";

const path = require("path");


export default class BibleCitationGetter{
    

    // Method to get a citation by book, chapter, and verse
    getCitation(book: string, chapter: number, verses: string,bible_version:string,basePath:string): string {
       

        let language:string = this.mapBibleVersionToLanguage(bible_version);

        let chapterString = chapter.toString(); 
        if (chapter < 10) {
            chapterString = "0" + chapterString;
        }   
        
        let bookNumber = this.mapBookToOrder(this.mapAbbreviationOrFrenchBookDefinitionToBook(book));
        
      
        
        // The folder structure is data/Bible/{language}/{bible_version}/by_chapter/{book}/{chapter}.md
        // The name for books and folders in the hard drive
        let bookFolder = this.mapBookToOrder(this.mapAbbreviationOrFrenchBookDefinitionToBook(book))
                         + "_" + this.mapAbbreviationOrFrenchBookDefinitionToBook(book);


        let chapterName = `Chapter_${chapterString}.md`;

        let filepath = `data/Bible/${language}/${bible_version.toUpperCase()}/by_chapter/${bookFolder}/${chapterName}`;

        filepath = path.join(basePath,".obsidian","plugins","Bible-Meditation-Helper", filepath);

        console.log(filepath);

        fsPromises.readFile(filepath, 'utf8')
            .then((data) => {
                console.log(data);
            })
            .catch((err) => {
                console.error(err);
            });
        
            return filepath
    }

    mapAbbreviationOrFrenchBookDefinitionToBook(abbreviation: string): string {
        const abbreviations: { [key: string]: string } = {
            "Gen": "Genesis",
            "Ex": "Exodus",
            "Lev": "Leviticus",
            "Num": "Numbers",
            "Deut": "Deuteronomy",
            "Josh": "Joshua",
            "Judg": "Judges",
            "Ruth": "Ruth",
            "1Sam": "I_Samuel",
            "2Sam": "II_Samuel",
            "1Kgs": "I_Kings",
            "2Kgs": "II_Kings",
            "1Chr": "I_Chronicles",
            "2Chr": "II_Chronicles",
            "Ezra": "Ezra",
            "Neh": "Nehemiah",
            "Esth": "Esther",
            "Job": "Job",
            "Ps": "Psalms",
            "Prov": "Proverbs",
            "Eccl": "Ecclesiastes",
            "Song": "Song_of_Solomon",
            "Isa": "Isaiah",
            "Jer": "Jeremiah",
            "Lam": "Lamentations",
            "Ezek": "Ezekiel",
            "Dan": "Daniel",
            "Hos": "Hosea",
            "Joel": "Joel",
            "Amos": "Amos",
            "Obad": "Obadiah",
            "Jonah": "Jonah",
            "Mic": "Micah",
            "Nah": "Nahum",
            "Hab": "Habakkuk",
            "Zeph": "Zephaniah",
            "Hag": "Haggai",
            "Zech": "Zechariah",
            "Mal": "Malachi",
            "Matt": "Matthew",
            "Mark": "Mark",
            "Luke": "Luke",
            "John": "John",
            "Acts": "Acts",
            "Rom": "Romans",
            "1Cor": "I_Corinthians",
            "2Cor": "II_Corinthians",
            "Gal": "Galatians",
            "Eph": "Ephesians",
            "Phil": "Philippians",
            "Col": "Colossians",
            "1Thess": "I_Thessalonians",
            "2Thess": "II_Thessalonians",
            "1Tim": "I_Timothy",
            "2Tim": "II_Timothy",
            "Titus": "Titus",
            "Phlm": "Philemon",
            "Heb": "Hebrews",
            "Jas": "James",
            "1Pet": "I_Peter",
            "2Pet": "II_Peter",
            "1John": "I_John",
            "2John": "II_John",
            "3John": "III_John",
            "Jude": "Jude",
            "Rev": "Revelation",


            "Genèse": "Genesis",
            "Exode": "Exodus",
            "Lévitique": "Leviticus",
            "Nombres": "Numbers",
            "Deutéronome": "Deuteronomy",
            "Josué": "Joshua",
            "Juges": "Judges",
            //"Ruth": "Ruth", Because the sintax are the same in french and english
            "1Samuel": "I_Samuel",
            "2Samuel": "II_Samuel",
            "1Rois": "I_Kings",
            "2Rois": "II_Kings",
            "1Chroniques": "I_Chronicles",
            "2Chroniques": "II_Chronicles",
            "Esdras": "Ezra",
            "Néhémie": "Nehemiah",
            "Esther": "Esther",
            //"Job": "Job",
            "Psaumes": "Psalms",
            "Proverbes": "Proverbs",
            "Ecclésiaste": "Ecclesiastes",
            "Cantique": "Song_of_Solomon",
            "Ésaïe": "Isaiah",
            "Jérémie": "Jeremiah",
            "Lamentations": "Lamentations",
            "Ézéchiel": "Ezekiel",
            "Daniel": "Daniel",
            "Osée": "Hosea",
            "Joël": "Joel",
            //"Amos": "Amos",
            "Abdias": "Obadiah",
            "Jonas": "Jonah",
            "Michée": "Micah",
            "Nahum": "Nahum",
            "Habacuc": "Habakkuk",
            "Sophonie": "Zephaniah",
            "Aggée": "Haggai",
            "Zacharie": "Zechariah",
            "Malachie": "Malachi",
            "Matthieu": "Matthew",
            "Marc": "Mark",
            "Luc": "Luke",
            "Jean": "John",
            "Actes": "Acts",
            "Romains": "Romans",
            "1Corinthiens": "I_Corinthians",
            "2Corinthiens": "II_Corinthians",
            "Galates": "Galatians",
            "Éphésiens": "Ephesians",
            "Philippiens": "Philippians",
            "Colossiens": "Colossians",
            "1Thessaloniciens": "I_Thessalonians",
            "2Thessaloniciens": "II_Thessalonians",
            "1Timothée": "I_Timothy",
            "2Timothée": "II_Timothy",
            "Tite": "Titus",
            "Philémon": "Philemon",
            "Hébreux": "Hebrews",
            "Jacques": "James",
            "1Pierre": "I_Peter",
            "2Pierre": "II_Peter",
            "1Jean": "I_John",
            "2Jean": "II_John",
            "3Jean": "III_John",
            //"Jude": "Jude",
            "Apocalypse": "Revelation"
        };
        return abbreviations[abbreviation] || "Unknown";
    }


    mapBibleVersionToLanguage(bible_version: string): string {
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
            "NEG": "fr",
            "PDV": "fr",
            "BDS": "fr"
        };
        return language[bible_version.toUpperCase() as keyof typeof language] || "None";

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
        else
        {  
            chapterString = chapterNUmber.toString();
        }
        return chapterString;
    }
}
