import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";


import BibleCitationGetter from "../src/bible_citation_getter";
import { CitationStyle, BibleVersion } from "../src/constants";

const root = path.resolve(__dirname, "..");

function fakeApp() {
    const files = new Map<string, string>();
    const adapter = {
        exists: async (p: string) => fs.existsSync(path.join(root, p)),
        read: async (p: string) => fs.readFileSync(path.join(root, p), "utf8"),
        list: async (p: string) => {
            const dir = path.join(root, p);
            const folders = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => `${p}/${e.name}`);
            return { files: [], folders };
        },
    };
    const vault = {
        configDir: ".obsidian", adapter,
        getAbstractFileByPath: (p: string) => files.has(p) ? { path: p } : (p.endsWith("citations") ? {} : null),
        createFolder: async () => { },
        create: async (p: string) => { files.set(p, ""); return { path: p }; },
    };
    return { app: { vault }, files };
}

const cite = async (fullText: string, style = CitationStyle.BLOCK) => {
    const { app, files } = fakeApp();
    const getter = new BibleCitationGetter({ app, pluginDir: "." });
    const reference = fullText.split("||")[0];
    const { citation } = await getter.getCitation({ reference, version: BibleVersion.ESV, style, fullText });
    return { citation, files };
};

describe("BibleCitationGetter with the real data", () => {
    it("discovers the versions of the data folder", async () => {
        const versions = await new BibleCitationGetter({ app: fakeApp().app, pluginDir: "." }).getAvailableVersions();
        expect(versions.map(v => v.version)).toEqual(["ESV", "KJV", "LSG10"]);
    });
    it("corrects 'judge 17:6' into Judges 17:6", async () => {
        const { citation } = await cite("judge 17:6||ESV");
        expect(citation).toContain("[[Judges 17_6|Judges 17:6 | ESV]]");
        expect(citation).toContain(">**6** ");
    });
    it("cites lists and ranges", async () => {
        const { citation } = await cite("John 3:16,18,20–22||ESV");
        expect([...citation.matchAll(/>\*\*(\d+)\*\*/g)].map(m => m[1])).toEqual(["16", "18", "20", "21", "22"]);
    });
    it("cites a range crossing chapters with chapter:verse labels", async () => {
        const { citation } = await cite("John 3:35-4:1||ESV");
        expect(citation).toContain(">**3:35**");
        expect(citation).toContain(">**4:1**");
    });
    it("cites several references", async () => {
        const { citation } = await cite("John 3:16; Rom 5:8||KJV");
        expect(citation).toContain("[[John 3_16; Romans 5_8|John 3:16; Romans 5:8 | KJV]]");
        expect(citation).toContain(">**Romans 5:8**");
    });
    it("uses French names for French versions", async () => {
        const { citation } = await cite("Genesis 1:1||LSG10");
        expect(citation).toContain("Genèse 1:1 | LSG10");
    });
    it("supports the inline style", async () => {
        const { citation } = await cite("John 3:16||ESV", CitationStyle.INLINE);
        expect(citation.startsWith("\"**16**")).toBe(true);
    });
    it("fails with a clear error", async () => {
        await expect(cite("John 99:1||ESV")).rejects.toThrow(/not found/);
        await expect(cite("Foo 1:1||ESV")).rejects.toThrow(/Invalid Bible citation/);
    });
});
