import { pluginCallout } from "./constants";
import { findCitations } from "./bible_books";

/** Turns "John 3:16||ESV" into the markdown of the plugin citation callout */
export type CitationRenderer = (reference: string) => Promise<string>;

export interface ConversionReport {
    content: string;
    converted: number;
    failed: { text: string; error: string }[];
}

const CALLOUT_START = `>${pluginCallout}`;
const LEFTOVER = /^\s*(?:[-*+]\s+|\d+[.)]\s+)?[\s,;.:–—-]*$/;

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Find the plain Bible citations in a text and turn them into plugin citations.
 * - A line that only contains citations is replaced by the callouts.
 * - A line that contains prose is kept and the callouts are added just after it.
 * - Callouts, quotes, code blocks and the front matter are left untouched.
 * - A citation that cannot be resolved is left as it is and reported.
 */
export async function convertPlainCitations(content: string, version: string, render: CitationRenderer): Promise<ConversionReport> {
    const lines = content.split("\n");
    const output: string[] = [];
    const report: ConversionReport = { content, converted: 0, failed: [] };

    let inFence = false;
    let inFrontMatter = lines[0]?.trim() === "---";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (inFrontMatter) {
            output.push(line);
            if (i > 0 && line.trim() === "---") inFrontMatter = false;
            continue;
        }
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            output.push(line);
            continue;
        }
        if (inFence || line.startsWith(">")) {
            output.push(line);
            continue;
        }

        const citations = findCitations(line);
        if (citations.length === 0) {
            output.push(line);
            continue;
        }

        let remainder = line;
        for (const citation of [...citations].reverse()) {
            // Reverse order to keep the offsets valid
            remainder = remainder.slice(0, citation.start) + remainder.slice(citation.end);
        }
        const proseLine = !LEFTOVER.test(remainder);

        if (proseLine && lines[i + 1]?.startsWith(CALLOUT_START)) {
            // The citations of this line were already converted by a previous run
            output.push(line);
            continue;
        }

        const callouts: string[] = [];
        for (const citation of citations) {
            try {
                callouts.push((await render(`${citation.text}||${version}`)).replace(/\n+$/, ""));
                report.converted++;
            } catch (error) {
                report.failed.push({ text: citation.text, error: errorMessage(error) });
            }
        }

        if (callouts.length === 0) {
            output.push(line);
            continue;
        }

        if (proseLine || callouts.length !== citations.length) {
            output.push(line);
        }
        callouts.forEach((callout, index) => {
            output.push(...callout.split("\n"));
            if (index < callouts.length - 1) output.push("");
        });
        // A line right after a callout would be absorbed by it
        if (i + 1 < lines.length && lines[i + 1].trim() !== "") output.push("");
    }

    report.content = output.join("\n");
    return report;
}

const CITATION_BLOCK = new RegExp(
    `^>[ \\t]*\\${pluginCallout.slice(0, -1)}\\][ \\t]*\\[\\[([^\\]\\n]+)\\]\\][ \\t]*(?:\\n|$)` +
    `(?:>(?![ \\t]*\\${pluginCallout.slice(0, -1)}\\]).*(?:\\n|$))*`,
    "gm"
);

/** Split the label of a citation link ("File|John 3:16 | ESV") into its reference and version */
export function parseCitationLabel(link: string): { reference: string; version: string } | null {
    const separator = link.indexOf("|");
    const label = separator === -1 ? link : link.slice(separator + 1);
    const versionSeparator = label.lastIndexOf("|");
    if (versionSeparator === -1) return null;
    const reference = label.slice(0, versionSeparator).trim();
    const version = label.slice(versionSeparator + 1).trim();
    return reference && version ? { reference, version } : null;
}

/** Rewrite every plugin citation of a text in another Bible version */
export async function changeCitationsVersion(content: string, version: string, render: CitationRenderer): Promise<ConversionReport> {
    const report: ConversionReport = { content, converted: 0, failed: [] };
    const pieces: string[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    const regex = new RegExp(CITATION_BLOCK.source, CITATION_BLOCK.flags);

    while ((match = regex.exec(content)) !== null) {
        pieces.push(content.slice(last, match.index));
        const parsed = parseCitationLabel(match[1]);
        let replacement = match[0];
        if (!parsed) {
            report.failed.push({ text: match[1], error: "Could not read the reference of this citation" });
        } else {
            try {
                replacement = await render(`${parsed.reference}||${version}`);
                report.converted++;
            } catch (error) {
                report.failed.push({ text: parsed.reference, error: errorMessage(error) });
            }
        }
        pieces.push(replacement);
        last = match.index + match[0].length;
    }
    pieces.push(content.slice(last));

    report.content = pieces.join("");
    return report;
}

export interface CitationBlock {
    /** The link of the block, e.g. "John 3_16|John 3:16 | ESV" */
    reference: string;
    /** The whole callout, with its verses */
    fullText: string;
    startIndex: number;
    endIndex: number;
}

/** Find the plugin citation callouts of a text, the last one first (to replace them safely) */
export function extractCitationBlocks(text: string): CitationBlock[] {
    const regex = new RegExp(CITATION_BLOCK.source, CITATION_BLOCK.flags);
    const blocks: CitationBlock[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        blocks.push({
            reference: match[1],
            fullText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
    }
    return blocks.reverse();
}
