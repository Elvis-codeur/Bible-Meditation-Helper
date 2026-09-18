import { describe, expect, it } from "vitest";
import { changeCitationsVersion, convertPlainCitations, extractCitationBlocks, parseCitationLabel } from "../src/citation_text";

const fakeRender = async (reference: string) => {
    if (reference.includes("Nowhere")) throw new Error("not found");
    const [ref, version] = reference.split("||");
    return `>[!bible-meditation-helper-citation]  [[File|${ref} | ${version}]]\n>**1** text\n`;
};

describe("convertPlainCitations", () => {
    it("replaces a line that only holds a citation", async () => {
        const r = await convertPlainCitations("Intro\nJohn 3:16\nOutro", "ESV", fakeRender);
        expect(r.content).toBe("Intro\n>[!bible-meditation-helper-citation]  [[File|John 3:16 | ESV]]\n>**1** text\n\nOutro");
        expect(r.converted).toBe(1);
    });
    it("keeps the prose and adds the citation after the line", async () => {
        const r = await convertPlainCitations("See John 3:16 for hope", "ESV", fakeRender);
        expect(r.content.startsWith("See John 3:16 for hope\n>[!bible")).toBe(true);
    });
    it("is idempotent on prose lines", async () => {
        const once = await convertPlainCitations("See John 3:16 for hope\nnext", "ESV", fakeRender);
        const twice = await convertPlainCitations(once.content, "ESV", fakeRender);
        expect(twice.content).toBe(once.content);
    });
    it("does not touch callouts, code blocks and front matter", async () => {
        const text = "---\ntitle: John 3:16\n---\n```\nJohn 3:16\n```\n> John 3:16 quoted";
        const r = await convertPlainCitations(text, "ESV", fakeRender);
        expect(r.content).toBe(text);
        expect(r.converted).toBe(0);
    });
    it("one failing citation does not abort the others", async () => {
        const failing = async (reference: string) => {
            if (reference.startsWith("Romans")) throw new Error("no data");
            return fakeRender(reference);
        };
        const r = await convertPlainCitations("John 3:16\nRomans 5:8\nJude 1:3", "ESV", failing);
        expect(r.converted).toBe(2);
        expect(r.failed).toHaveLength(1);
        expect(r.content).toContain("\nRomans 5:8\n");
    });
    it("handles bullets and several citations in a line", async () => {
        const r = await convertPlainCitations("- John 3:16; Romans 5:8", "KJV", fakeRender);
        expect(r.converted).toBe(2);
        expect(r.content).not.toContain("- John");
    });
});

describe("changeCitationsVersion", () => {
    const block = (v: string, extra = "") => `>[!bible-meditation-helper-citation]  [[File|John 3:16${extra} | ${v}]]\n>**16** text\n`;
    it("rewrites every citation, adjacent ones included", async () => {
        const r = await changeCitationsVersion(`a\n\n${block("ESV")}${block("KJV")}\nb`, "LSG10", fakeRender);
        expect(r.converted).toBe(2);
        expect(r.content).toContain("| LSG10]]");
        expect(r.content).not.toContain("| ESV]]");
    });
    it("reads the version even when the label contains other |", () => {
        expect(parseCitationLabel("File|John 3:16 | ESV")).toEqual({ reference: "John 3:16", version: "ESV" });
        expect(parseCitationLabel("File|A | B | KJV")).toEqual({ reference: "A | B", version: "KJV" });
        expect(parseCitationLabel("no label")).toBeNull();
    });
    it("reports the citations it could not rewrite and keeps them", async () => {
        const text = block("ESV", "").replace("John 3:16", "Nowhere 1:1");
        const r = await changeCitationsVersion(text, "KJV", fakeRender);
        expect(r.failed).toHaveLength(1);
        expect(r.content).toBe(text);
    });
    it("extractCitationBlocks lists the last block first", () => {
        const blocks = extractCitationBlocks(block("ESV") + "\n" + block("KJV"));
        expect(blocks).toHaveLength(2);
        expect(blocks[0].startIndex).toBeGreaterThan(blocks[1].startIndex);
    });
});
