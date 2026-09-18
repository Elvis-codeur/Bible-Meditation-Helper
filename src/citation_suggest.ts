import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, Notice, TFile } from "obsidian";
import type BibleCitationPlugin from "./main";
import BibleCitationGetter from "./bible_citation_getter";
import { findCitations } from "./bible_books";
import { CitationStyle } from "./constants";

interface CitationSuggestion {
	version: string;
	reference: string;
}

/** While typing "John 3:16" proposes to turn it into a citation (one entry per Bible version). */
export class CitationSuggest extends EditorSuggest<CitationSuggestion> {
	constructor(private plugin: BibleCitationPlugin) {
		super(plugin.app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.enableCitationSuggest) return null;

		const beforeCursor = editor.getLine(cursor.line).slice(0, cursor.ch);
		const found = findCitations(beforeCursor).find(c => c.end === cursor.ch);
		if (!found) return null;

		return { start: { line: cursor.line, ch: found.start }, end: cursor, query: found.text };
	}

	async getSuggestions(context: EditorSuggestContext): Promise<CitationSuggestion[]> {
		const versions = await this.plugin.getBibleVersions();
		const preferred = this.plugin.settings.preferredBibleVersion;
		versions.sort((a, b) => Number(b === preferred) - Number(a === preferred));
		return versions.map(version => ({ version, reference: context.query }));
	}

	renderSuggestion(suggestion: CitationSuggestion, el: HTMLElement): void {
		el.setText(`${suggestion.reference}  (${suggestion.version})`);
	}

	async selectSuggestion(suggestion: CitationSuggestion): Promise<void> {
		const context = this.context;
		if (!context) return;
		const { editor, start, end } = context;

		try {
			const getter = new BibleCitationGetter({ app: this.plugin.app, pluginDir: this.plugin.pluginDir });
			const { citation } = await getter.getCitation({
				reference: suggestion.reference,
				version: suggestion.version as any,
				style: CitationStyle.BLOCK,
				fullText: `${suggestion.reference}||${suggestion.version}`,
			});

			// The citation is a block: it goes after the line, the typed reference is removed
			const line = editor.getLine(start.line);
			const onlyReference = line.slice(0, start.ch).trim() === "" && line.slice(end.ch).trim() === "";
			if (onlyReference) {
				editor.replaceRange(citation.replace(/\n$/, ""), { line: start.line, ch: 0 }, { line: start.line, ch: line.length });
			} else {
				editor.replaceRange("\n" + citation.replace(/\n$/, ""), { line: start.line, ch: line.length });
				editor.replaceRange("", start, end);
			}
		} catch (error) {
			new Notice(`Could not add the citation "${suggestion.reference}": ${error.message}`, 8000);
		}
	}
}
