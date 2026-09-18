import { BOOK_ALIASES, BOOK_ORDER } from "./bible_books_data";

export interface VerseRange {
    start: number;
    /** null means "up to the end of the chapter" (e.g. "16-") */
    end: number | null;
}

export interface ChapterSegment {
    chapter: number;
    ranges: VerseRange[];
}

export interface ParsedCitation {
    /** Canonical book name, as used in the data folder (e.g. "I_Samuel") */
    book: string;
    /** Human readable reference (e.g. "I Samuel 3:16-18") */
    label: string;
    segments: ChapterSegment[];
}

export interface FoundCitation {
    start: number;
    end: number;
    text: string;
}

const DASHES = "-–—";

function stripDiacritics(text: string): string {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Return the canonical book name for a name or abbreviation ("1 Sam.", "Jn", "Genèse"...), or null. */
export function resolveBook(raw: string): string | null {
    const key = raw.toLowerCase().replace(/[\s._]/g, "");
    if (!key) return null;

    const direct = BOOK_ALIASES[key] ?? BOOK_ALIASES[stripDiacritics(key)];
    if (direct) return direct;

    // Roman numeral prefix: "iisamuel" -> "2samuel"
    const roman = key.match(/^(iii|ii|i)(?=[a-zÀ-ɏ])/);
    if (roman) {
        const digit = String(roman[1].length);
        const rest = key.slice(roman[1].length);
        return BOOK_ALIASES[digit + rest] ?? BOOK_ALIASES[stripDiacritics(digit + rest)] ?? null;
    }
    return null;
}

/** "43_John" style folder name of a canonical book */
export function bookFolderName(book: string): string {
    const index = BOOK_ORDER.indexOf(book);
    if (index === -1) throw new Error(`Unknown Bible book "${book}"`);
    return `${String(index + 1).padStart(2, "0")}_${book}`;
}

export function bookDisplayName(book: string): string {
    return book.replace("Revelation_of_John", "Revelation").replace(/_/g, " ");
}

/** Name used in the file of a citation ("Revelation_of_John" is shortened) */
export function bookFileName(book: string): string {
    return book.replace("Revelation_of_John", "Revelation");
}

function addRange(segments: ChapterSegment[], chapter: number, range: VerseRange) {
    const last = segments[segments.length - 1];
    if (last && last.chapter === chapter) {
        last.ranges.push(range);
    } else {
        segments.push({ chapter, ranges: [range] });
    }
}

const VERSE_TOKEN = new RegExp(`^(?:(\\d+):)?(\\d+)(?:([${DASHES}])(?:(\\d+):)?(\\d*))?$`);

function parseVerseSpec(spec: string, firstChapter: number, reference: string): ChapterSegment[] {
    const segments: ChapterSegment[] = [];
    let chapter = firstChapter;

    for (const token of spec.split(",")) {
        if (token === "") continue;
        const m = token.match(VERSE_TOKEN);
        if (!m) {
            throw new Error(`Invalid verse "${token}" in citation "${reference}"`);
        }
        const [, chapterPrefix, first, dash, secondChapter, second] = m;
        if (chapterPrefix) chapter = parseInt(chapterPrefix);
        const start = parseInt(first);

        if (!dash) {
            addRange(segments, chapter, { start, end: start });
        } else if (secondChapter) {
            // John 3:16-4:2 -> end of chapter 3, chapters in between, beginning of chapter 4
            const endChapter = parseInt(secondChapter);
            if (endChapter < chapter) throw new Error(`Invalid chapter range in citation "${reference}"`);
            addRange(segments, chapter, { start, end: null });
            for (let c = chapter + 1; c < endChapter; c++) {
                addRange(segments, c, { start: 1, end: null });
            }
            addRange(segments, endChapter, { start: 1, end: second === "" ? null : parseInt(second) });
            chapter = endChapter;
        } else {
            addRange(segments, chapter, { start, end: second === "" ? null : parseInt(second) });
        }
    }
    return segments;
}

const BOOK_CHAPTER = /^(.*?[\p{L}.])\s*(\d{1,3})\s*(?::\s*(.*))?$/u;
const INHERITED_BOOK = /^(\d{1,3})\s*:\s*(.*)$/;

/**
 * Parse a reference such as "John 3:16", "John 3:16-18", "John 3:16,18,20–22", "John 3:16-4:2",
 * "Psalms 23:1-" (up to the end of the chapter) or several references separated by ";"
 * ("John 3:16; Rom 5:8; 6:1"). A reference without verses ("John 3") designates the whole chapter.
 */
export function parseCitations(reference: string): ParsedCitation[] {
    const result: ParsedCitation[] = [];
    let previousBook: string | null = null;

    for (const rawPart of reference.split(";")) {
        const part = rawPart.trim();
        if (part === "") continue;

        let book: string | null;
        let chapter: number;
        let verses: string | undefined;

        const inherited = part.match(INHERITED_BOOK);
        if (inherited && previousBook) {
            book = previousBook;
            chapter = parseInt(inherited[1]);
            verses = inherited[2];
        } else {
            const m = part.match(BOOK_CHAPTER);
            book = m ? resolveBook(m[1]) : null;
            if (!m || !book) {
                throw new Error(`Invalid Bible citation: "${part}"`);
            }
            chapter = parseInt(m[2]);
            verses = m[3];
        }
        previousBook = book;

        const cleaned = (verses ?? "").replace(/\s+/g, "").replace(new RegExp(`[${DASHES}]`, "g"), "-");
        const segments = cleaned === ""
            ? [{ chapter, ranges: [{ start: 1, end: null }] }]
            : parseVerseSpec(cleaned, chapter, part);

        if (segments.length === 0) throw new Error(`No verse found in citation "${part}"`);

        result.push({
            book,
            label: `${bookDisplayName(book)} ${chapter}${cleaned === "" ? "" : ":" + cleaned}`,
            segments,
        });
    }

    if (result.length === 0) throw new Error(`Invalid Bible citation: "${reference}"`);
    return result;
}

// One verse item: 16 | 16-18 | 16- | 16-4:2 ; the negative lookahead keeps ", 2 apples" out of a citation
const VERSE_ITEM = `\\d{1,3}(?:\\s?[${DASHES}]\\s?(?:\\d{1,3}\\s?:\\s?)?\\d{1,3}|\\s?[${DASHES}](?![\\d\\s]))?`;
const CITATION_PATTERN =
    `((?:[1-3]\\s?\\p{L}[\\p{L}.]*|\\p{Lu}[\\p{L}.]*)(?:\\s+\\p{L}[\\p{L}.]*){0,3})\\s?(\\d{1,3})\\s?:\\s?` +
    `${VERSE_ITEM}(?:\\s?,\\s?${VERSE_ITEM}(?!\\s?\\p{L}))*`;

/**
 * Find the Bible citations that are written in a text. Only references to a known book that
 * contain a chapter and a verse are returned, so "Chapter 3" or "Mark 5 minutes" are ignored.
 */
export function findCitations(text: string): FoundCitation[] {
    const regex = new RegExp(CITATION_PATTERN, "gu");
    const found: FoundCitation[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        const bookText = match[1];
        const previous = text.charAt(match.index - 1);
        if (match.index > 0 && /[\p{L}\d]/u.test(previous)) continue;

        // "Read John 3:16": drop leading words until the rest is a known book
        const tokens = bookText.split(/\s+/);
        let offset = 0;
        let bookStart = -1;
        for (let i = 0; i < tokens.length; i++) {
            const position = bookText.indexOf(tokens[i], offset);
            offset = position + tokens[i].length;
            if (resolveBook(tokens.slice(i).join(""))) {
                bookStart = position;
                break;
            }
        }
        if (bookStart === -1) continue;

        const start = match.index + bookStart;
        const end = match.index + match[0].length;
        found.push({ start, end, text: text.slice(start, end) });
    }
    return found;
}

export interface Verse {
    number: number;
    text: string;
}

/** Read the verses of a chapter file ("# Chapter 1", then "1. text", "2. text", ...) */
export function parseChapterVerses(chapterContent: string): Verse[] {
    const body = chapterContent.split("\n").slice(1).join("\n"); // remove the chapter title line
    const verses: Verse[] = [];
    for (const chunk of body.split(/(?=\b\d+\.\s)/g)) {
        const dot = chunk.indexOf(".");
        if (dot === -1) continue;
        const number = parseInt(chunk.slice(0, dot));
        if (isNaN(number)) continue;
        verses.push({ number, text: chunk.slice(dot + 1).trim() });
    }
    return verses;
}

export function selectVerses(verses: Verse[], ranges: VerseRange[]): Verse[] {
    return verses.filter(v =>
        ranges.some(r => v.number >= r.start && v.number <= (r.end ?? Number.MAX_SAFE_INTEGER))
    );
}
