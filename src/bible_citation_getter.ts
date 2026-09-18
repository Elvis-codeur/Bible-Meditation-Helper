import { Notice, TFile } from "obsidian";
import {
    pluginCallout, defaultCitationFolder, mapEnglishToFrenchBibleBooks,
    BibleCitation, CitationStyle, InlineQuoteStyle, BibleVersion,
} from "./constants";
import { Verse } from "./type_definitions";
import {
    bookDisplayName, bookFileName, bookFolderName, parseChapterVerses, parseCitations, selectVerses, ParsedCitation,
} from "./bible_books";
import { BibleVersionInfo, discoverVersions, languageOfVersion } from "./bible_versions";
import { changeCitationsVersion, convertPlainCitations, ConversionReport, extractCitationBlocks } from "./citation_text";

export const extractBibleCitations = async (text: string) => extractCitationBlocks(text);

export default class BibleCitationGetter {
    vault: any;
    app: any;
    pluginDir: string;
    private versions: BibleVersionInfo[] | null = null;

    constructor({ app, pluginDir }: { app: any; pluginDir?: string }) {
        this.app = app;
        this.vault = app.vault;
        this.pluginDir = pluginDir ?? `${app.vault.configDir}/plugins/Bible-Meditation-Helper`;
    }

    async getAvailableVersions(): Promise<BibleVersionInfo[]> {
        if (this.versions === null) {
            this.versions = await discoverVersions(this.vault.adapter, this.pluginDir);
        }
        return this.versions;
    }

    private bookLabel(reference: ParsedCitation, language: string, forFile: boolean): string {
        const name = forFile
            ? bookFileName(reference.book)
            : (language === "fr" ? mapEnglishToFrenchBibleBooks.get(reference.book) : undefined)
                ?? bookDisplayName(reference.book);
        return `${name} ${reference.chapterSpec}`;
    }

    /**
     * Build the citation for `citationObject.fullText` ("John 3:16||ESV"). The reference can contain several
     * verses, ranges and chapters ("John 3:16,18,20-22", "John 3:16-4:2; Rom 5:8") and small typing errors
     * in the name of the book are corrected ("judge 17:6").
     */
    async getCitation(citationObject: BibleCitation): Promise<{ citation: string }> {
        const text = citationObject.fullText;
        const separator = text.lastIndexOf("||");
        if (separator === -1) {
            throw new Error("No Bible version has been chosen");
        }
        const bibleVersion = text.slice(separator + 2).trim();
        const language = languageOfVersion(bibleVersion, await this.getAvailableVersions());

        const references = parseCitations(text.slice(0, separator).replace(/\s+/g, " "), true);

        const chapterCount = new Set(references.flatMap(r => r.segments.map(s => `${r.book}|${s.chapter}`))).size;
        const multipleBooks = new Set(references.map(r => r.book)).size > 1;

        const verses_list: Verse[] = [];
        for (const reference of references) {
            for (const segment of reference.segments) {
                const verses = await this.readVerses(reference.book, segment.chapter, bibleVersion, language);
                const selected = selectVerses(verses, segment.ranges);
                if (selected.length === 0) {
                    throw new Error(`${bookDisplayName(reference.book)} ${segment.chapter}: verse not found in ${bibleVersion}`);
                }
                const bookName = (language === "fr" ? mapEnglishToFrenchBibleBooks.get(reference.book) : undefined)
                    ?? bookDisplayName(reference.book);
                for (const verse of selected) {
                    let label: string | undefined;
                    if (multipleBooks) label = `${bookName} ${segment.chapter}:${verse.number}`;
                    else if (chapterCount > 1) label = `${segment.chapter}:${verse.number}`;
                    verses_list.push({ verse_number: verse.number, verse_text: verse.text, verse_label: label });
                }
            }
        }

        const fileName = references.map(r => this.bookLabel(r, language, true)).join("; ");
        const file = await this.createFileInSubfolder(defaultCitationFolder, fileName + ".md");
        const citationMeta = {
            filePath: file.path.split("/").pop()?.replace(/\.md$/, ""),
            citationPlaceholder: references.map(r => this.bookLabel(r, language, false)).join("; "),
            bibleVersion,
        };

        const citation = citationObject.style === CitationStyle.INLINE
            ? this.getInlineCitation(verses_list, citationObject.inlineStyle, citationMeta)
            : this.getBlockCitation(verses_list, citationMeta);
        return { citation };
    }

    private async readVerses(book: string, chapter: number, bibleVersion: string, language: string) {
        const chapterName = `Chapter_${String(chapter).padStart(2, "0")}.md`;
        const filepath = `${this.pluginDir}/data/Bible/${language}/${bibleVersion.toUpperCase()}/by_chapter/${bookFolderName(book)}/${chapterName}`;

        if (!(await this.vault.adapter.exists(filepath))) {
            throw new Error(`${bookDisplayName(book)} ${chapter} not found in ${bibleVersion}`);
        }
        return parseChapterVerses(await this.vault.adapter.read(filepath));
    }

    getInlineCitation(verses_list: Array<Verse>,
        inlineQuoteStyleObject?: InlineQuoteStyle,
        citationMeta?: {
            filePath?: string, citationPlaceholder?: string,
            bibleVersion?: string,
        }): string {


        if (verses_list.length === 0) {
            return "";
        }

        let citationReference = "";

        if (citationMeta && citationMeta.filePath && citationMeta.citationPlaceholder && citationMeta.bibleVersion) {
            citationReference = `[[${citationMeta.filePath}|${citationMeta.citationPlaceholder} | ${citationMeta.bibleVersion.trim().toUpperCase()}]]`;
        }

        if (inlineQuoteStyleObject == InlineQuoteStyle.FRENCH) {
            return "« " + verses_list.map((value) => {
                const num = value.verse_label ?? value.verse_number;
                const txt = value.verse_text;
                return `**${num}** ${txt}`;
            }).join(" ") + " » " + citationReference;
        }
        else {
            return "\"" + verses_list.map((value) => {
                const num = value.verse_label ?? value.verse_number;
                const txt = value.verse_text;
                return `**${num}** ${txt}`;
            }).join(" ") + "\" " + citationReference;
        }

    }

    getBlockCitation(verses_list: Array<Verse>, citationMeta?: { filePath?: string, citationPlaceholder?: string, bibleVersion?: string }): string {
        // citationMeta is optional, but if provided, use it for the header line
        let header = "";
        if (citationMeta && citationMeta.filePath && citationMeta.citationPlaceholder && citationMeta.bibleVersion) {
            header = `>${pluginCallout}  [[${citationMeta.filePath}|${citationMeta.citationPlaceholder} | ${citationMeta.bibleVersion.trim().toUpperCase()}]]\n`;
        }
        // verses_list: array of {verse_number, verse_text} or {number, text}
        return (
            header +
            verses_list.map((value) => {
                // Support both {verse_number, verse_text} and {number, text}
                const num = value.verse_label ?? value.verse_number;
                const txt = value.verse_text;
                return `>**${num}** ${txt}\n`;
            }).join("")
        );
    }


    // Helper function to remove invalid filename characters
    sanitizeFileName(fileName: string): string {
        return fileName.replace(/[\/\\*?"<>|]/g, "").replace(/:/g, "_");
    }

    async createFileInSubfolder(folderPath: string, fileName: string, content: string = ""): Promise<TFile> {
        const vault = this.app.vault;

        // Ensure the folder exists, create it if it doesn’t
        if (!vault.getAbstractFileByPath(folderPath)) {
            await vault.createFolder(folderPath);
        }

        const filePath = `${folderPath}/${this.sanitizeFileName(fileName)}`;
        return vault.getAbstractFileByPath(filePath) ?? await vault.create(filePath, content);
    }

    /** Renders "reference||VERSION" as a block citation (used to convert texts) */
    render = async (reference: string) => {
        const separator = reference.lastIndexOf("||");
        const version = reference.slice(separator + 2) as BibleVersion;
        return (await this.getCitation({
            reference: reference.slice(0, separator),
            version,
            style: CitationStyle.BLOCK,
            fullText: reference,
        })).citation;
    };
}

export async function convertPlainCitationsToPluggingCitationsInText(
    app: any, pluginDir: string, content: string, newBibleCitationVersion: string
): Promise<ConversionReport> {
    return convertPlainCitations(content, newBibleCitationVersion, new BibleCitationGetter({ app, pluginDir }).render);
}

export async function changeBibleCitationVersionInText(
    app: any, pluginDir: string, content: string, newBibleCitationVersion: string
): Promise<ConversionReport> {
    return changeCitationsVersion(content, newBibleCitationVersion, new BibleCitationGetter({ app, pluginDir }).render);
}
