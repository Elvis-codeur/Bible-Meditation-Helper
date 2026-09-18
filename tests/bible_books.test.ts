import { describe, expect, it } from "vitest";
import { findCitations, parseChapterVerses, parseCitations, resolveBook, selectVerses } from "../src/bible_books";

describe("resolveBook", () => {
    it("knows names, abbreviations, French names and roman numerals", () => {
        expect(resolveBook("Judges")).toBe("Judges");
        expect(resolveBook("1 Sam.")).toBe("I_Samuel");
        expect(resolveBook("II Kings")).toBe("II_Kings");
        expect(resolveBook("Genèse")).toBe("Genesis");
        expect(resolveBook("Jn")).toBe("John");
        expect(resolveBook("Song of Solomon")).toBe("Song_of_Solomon");
    });
    it("only corrects typing errors when fuzzy matching is asked", () => {
        expect(resolveBook("judge")).toBeNull();
        expect(resolveBook("judge", true)).toBe("Judges");
        expect(resolveBook("Genesys", true)).toBe("Genesis");
        expect(resolveBook("xyzabc", true)).toBeNull();
    });
});

describe("parseCitations", () => {
    it("parses a single verse and a range", () => {
        expect(parseCitations("John 3:16")[0].segments).toEqual([{ chapter: 3, ranges: [{ start: 16, end: 16 }] }]);
        expect(parseCitations("1 John 3:16-18")[0].segments[0].ranges).toEqual([{ start: 16, end: 18 }]);
    });
    it("accepts commas and the en dash (#40, #43)", () => {
        const [c] = parseCitations("John 3:16,18,20–22");
        expect(c.segments[0].ranges).toEqual([{ start: 16, end: 16 }, { start: 18, end: 18 }, { start: 20, end: 22 }]);
        expect(c.label).toBe("John 3:16,18,20-22");
    });
    it("supports open ended ranges and whole chapters", () => {
        expect(parseCitations("Psalms 23:1-")[0].segments[0].ranges).toEqual([{ start: 1, end: null }]);
        expect(parseCitations("John 3")[0].segments[0].ranges).toEqual([{ start: 1, end: null }]);
    });
    it("supports ranges crossing chapters", () => {
        const [c] = parseCitations("John 3:16-5:2");
        expect(c.segments).toEqual([
            { chapter: 3, ranges: [{ start: 16, end: null }] },
            { chapter: 4, ranges: [{ start: 1, end: null }] },
            { chapter: 5, ranges: [{ start: 1, end: 2 }] },
        ]);
    });
    it("supports several references separated by ; and an inherited book", () => {
        const list = parseCitations("John 3:16; Rom 5:8; 6:1");
        expect(list.map(c => c.book)).toEqual(["John", "Romans", "Romans"]);
        expect(list[2].segments[0].chapter).toBe(6);
    });
    it("corrects 'judge 17:6' into Judges 17:6", () => {
        const [c] = parseCitations("judge 17:6", true);
        expect(c.book).toBe("Judges");
        expect(c.label).toBe("Judges 17:6");
    });
    it("throws on garbage", () => {
        expect(() => parseCitations("hello")).toThrow();
        expect(() => parseCitations("Foo 3:16")).toThrow();
        expect(() => parseCitations("John 3:x")).toThrow();
    });
});

describe("findCitations", () => {
    const texts = (s: string) => findCitations(s).map(c => c.text);
    it("finds citations inside prose", () => {
        expect(texts("As said in John 3:16, God loves.")).toEqual(["John 3:16"]);
        expect(texts("Read 1 John 4:7-8 and Romans 5:8")).toEqual(["1 John 4:7-8", "Romans 5:8"]);
        expect(texts("Genèse 1:1")).toEqual(["Genèse 1:1"]);
    });
    it("keeps lists and ranges together", () => {
        expect(texts("John 3:16,18–20")).toEqual(["John 3:16,18–20"]);
        expect(texts("John 3:16-4:2")).toEqual(["John 3:16-4:2"]);
    });
    it("ignores what is not a citation", () => {
        expect(texts("Chapter 3 is long")).toEqual([]);
        expect(texts("Mark 5 minutes")).toEqual([]);
        expect(texts("At John 3:16, 2 apples")).toEqual(["John 3:16"]);
        expect(texts("Meeting at Noon 12:30")).toEqual([]);
    });
});

describe("chapter files", () => {
    const chapter = "# Chapter 1\n\n1. In the beginning.\n2. Second verse.\n3. Third verse.";
    it("reads the verses, including the last one", () => {
        const verses = parseChapterVerses(chapter);
        expect(verses.map(v => v.number)).toEqual([1, 2, 3]);
        expect(verses[2].text).toBe("Third verse.");
    });
    it("selects ranges", () => {
        const verses = parseChapterVerses(chapter);
        expect(selectVerses(verses, [{ start: 1, end: 1 }, { start: 3, end: null }]).map(v => v.number)).toEqual([1, 3]);
    });
});
