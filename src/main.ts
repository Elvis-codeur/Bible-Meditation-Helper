import { App, MarkdownPostProcessorContext, Modal, Notice, Plugin, TFile, Vault } from "obsidian";

import BibleCitationGetter, { changeBibleCitationVersionInText, convertPlainCitationsToPluggingCitationsInText } from "./bible_citation_getter";
import { BibleCitationChangePlainTextCitation, BibleCitationPromptModal, BibleCitationVersionChangePromptModal } from "./prompt_modals";
import { TranslateNotes, } from "./translate_not";
import { TranslationModal } from "./prompt_modals"
import { BibleCitationSettingTab } from './settings-tab';
import { BibleCitationPluginSettings, CalloutBlock } from "./type_definitions";
import { BibleCitation, pluginCallout } from "./constants";
import { DEFAULT_VERSIONS } from "./bible_versions";
import { changeCitationsVersion } from "./citation_text";
import { CitationSuggest } from "./citation_suggest";






export default class BibleCitationPlugin extends Plugin {
	settings: BibleCitationPluginSettings;
	wasmInitialized = false;

	async saveSettings() {
		await this.saveData(this.settings);
	}

	

	async loadSettings() {
		this.settings = Object.assign({
			openaiApiKey: '',
			claudeApiKey: '',
			geminiApiKey: '',
			deeplApiKey: '',
			googleTranslateApiKey: '',
			customTranslationPrompts: [],  // initialize with empty array
			translationsOutputFolder: '',
			preferredBibleVersion: '',
			enableCitationSuggest: false
		}, await this.loadData());
	}

	/** Folder of the plugin in the vault (contains the Bible data) */
	get pluginDir(): string {
		return this.manifest.dir ?? `${this.app.vault.configDir}/plugins/Bible-Meditation-Helper`;
	}

	preferredVersionStore = {
		get: () => this.settings.preferredBibleVersion || undefined,
		set: async (version: string) => {
			this.settings.preferredBibleVersion = version;
			await this.saveSettings();
		}
	};

	async getBibleVersions(): Promise<string[]> {
		const found = await new BibleCitationGetter({ app: this.app, pluginDir: this.pluginDir }).getAvailableVersions();
		return found.length > 0 ? found.map(v => v.version) : DEFAULT_VERSIONS;
	}

	async onload() {

		// Add this at the beginning of onload
		await this.loadSettings();

		// Add this line to register the settings tab
		this.addSettingTab(new BibleCitationSettingTab(this.app, this));


		// Bible citations adding command 
		this.addCommand({
			id: 'create-bible-citation',
			name: 'Create Bible Citation',
			callback: () => this.createBibleCitation(),
			hotkeys: [
				{
					modifiers: ["Mod"], // "Mod" is a placeholder for Ctrl on Windows/Linux and Cmd on macOS
					key: "j", // You can change this to any key you prefer
				},
			],
		});

		// Turn the citations in the file to another version command 
		this.addCommand(
			{
				id: "change-bible-citation-version",
				name: "Change the version of the citations in the document",
				callback: () => this.changeBibleCitationVersion(),
				hotkeys: [
					{
						modifiers: ["Mod"], // "Mod" is a placeholder for Ctrl on Windows/Linux and Cmd on macOS
						key: "m", // You can change this to any key you prefer
					},
				],
			}
		)



		// Turn the citations in the file to another version command 
		this.addCommand(
			{
				id: "convert-plain-citation-to-plugging-citations",
				name: "Find the plain bible citations in the document and turn them into the plugging citations",
				callback: () => this.convertPlainCitationsToPluggingCitations(),
				hotkeys: [
					{
						modifiers: ["Alt"], // "Mod" is a placeholder for Ctrl on Windows/Linux and Cmd on macOS
						key: "m", // You can change this to any key you prefer
					},
				],
			}
		)

		// Translate the current note 
		this.addCommand(
			{
				id: "translate-note",
				name: "Translate the current note",
				callback: () => this.translate_note(),
				hotkeys: [
					{
						modifiers: ["Alt"], // "Mod" is a placeholder for Ctrl on Windows/Linux and Cmd on macOS
						key: "T", // You can change this to any key you prefer
					},
				],
			}
		)


		// Right click on a citation: change the version of this citation only
		this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
			const block = this.findCitationBlock(editor, editor.getCursor().line);
			if (!block) return;
			menu.addItem(item => item
				.setTitle("Change the Bible version of this citation")
				.setIcon("book-open")
				.onClick(() => this.changeSingleCitationVersion(editor, block)));
		}));

		this.registerEditorSuggest(new CitationSuggest(this));

		this.loadStyles();
	}

	/** Lines of the plugin citation callout the given line belongs to, or null */
	findCitationBlock(editor: any, line: number): { start: number, end: number } | null {
		const isQuote = (i: number) => editor.getLine(i).startsWith(">");
		const isStart = (i: number) => editor.getLine(i).replace(/^>\s*/, "").startsWith(pluginCallout);
		if (!isQuote(line)) return null;

		let start = line;
		while (start >= 0 && isQuote(start) && !isStart(start)) start--;
		if (start < 0 || !isQuote(start) || !isStart(start)) return null;

		let end = start + 1;
		while (end < editor.lineCount() && isQuote(end) && !isStart(end)) end++;
		return line < end ? { start, end } : null;
	}

	async changeSingleCitationVersion(editor: any, block: { start: number, end: number }) {
		const version = await this.getBibleVersionFromUserChangeExistingCitationsVersion();
		if (!version) return;

		const lastLine = editor.lineCount();
		const from = { line: block.start, ch: 0 };
		const to = block.end >= lastLine ? { line: lastLine - 1, ch: editor.getLine(lastLine - 1).length } : { line: block.end, ch: 0 };
		let text = editor.getRange(from, to);
		if (block.end < lastLine) { /* the block keeps its final newline */ } else { text += "\n"; }

		const report = await changeCitationsVersion(text, version, new BibleCitationGetter({ app: this.app, pluginDir: this.pluginDir }).render);
		if (report.failed.length > 0) {
			new Notice(`Could not change the version: ${report.failed[0].error}`, 6000);
			return;
		}
		editor.replaceRange(block.end >= lastLine ? report.content.replace(/\n$/, "") : report.content, from, to);
		new Notice(`Citation updated to version: ${version}`);
	}

	


	async translate_note() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file to translate');
			return;
		}

		new TranslationModal(this.app, async (result) => {
			try {
				const translator = new TranslateNotes(this.app, {
					openaiApiKey: this.settings.openaiApiKey,
					claudeApiKey: this.settings.claudeApiKey,
					geminiApiKey: this.settings.geminiApiKey,
					deeplApiKey: this.settings.deeplApiKey,
					googleTranslateApiKey: this.settings.googleTranslateApiKey,
					translationsOutputFolder: this.settings.translationsOutputFolder,

				});

				await translator.translateNote(
					activeFile,
					result.service,
					result.targetLang,
					result.bibleVersion,
					result.customPrompt,
					result.model
				);

				new Notice(`Translation completed for ${activeFile.basename}`);
			} catch (error) {
				console.error('Translation error:', error);
				new Notice(`Translation failed: ${error.message}`);
			}
		},
			this.settings.customTranslationPrompts,


		).open();
	}

	async loadStyles() {
		try {
			const cssFile = await this.app.vault.adapter.read(`${this.pluginDir}/styles/citation_callout_style.css`);
			const style = document.createElement('style');
			style.textContent = cssFile;
			document.head.appendChild(style);
			this.register(() => style.remove());
		} catch (error) {
			console.error("Could not load the citation callout style", error);
		}
	}

	async convertPlainCitationsToPluggingCitations() {
		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) {
			new Notice("No active document found.");
			return;
		}

		const view = activeLeaf.view;
		if (view.getViewType() !== 'markdown') {
			new Notice("Active document is not a markdown file.");
			return;
		}

		const editor = (view as any).editor;
		const content = editor.getValue();
		// Prompt the user to select a new version
		const newBibleCitationVersion = await this.getBibleVersionFromUserPlainTextCitationCase();


		if (!newBibleCitationVersion) {
			new Notice("No version selected.");
			return;
		}

		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			console.error('No active file found');
			return;
		}

		const report = await convertPlainCitationsToPluggingCitationsInText(this.app, this.pluginDir, content, newBibleCitationVersion);
		this.notifyReport(report, "converted");

		if (report.converted > 0) {
			await this.app.vault.modify(activeFile, report.content);
		}

	}


	async getCitationFromUser(): Promise<BibleCitation | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationPromptModal(this.app, resolve, this);
			prompt.open();
		});
	}

	extractBibleVersion(citation: string): string | null {
		// Regex to match the Bible version at the end of the citation block
		const versionRegex = /\|\s*([A-Z]+)\s*\]\]/;
		const match = citation.match(versionRegex);

		// If a match is found, return the version, otherwise return null
		return match ? match[1] : null;
	}


	async changeBibleCitationVersion() {

		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) {
			new Notice("No active document found.");
			return;
		}

		const view = activeLeaf.view;
		if (view.getViewType() !== 'markdown') {
			new Notice("Active document is not a markdown file.");
			return;
		}

		const editor = (view as any).editor;
		const content = editor.getValue();


		// Prompt the user to select a new version
		const newBibleCitationVersion = await this.getBibleVersionFromUserChangeExistingCitationsVersion();

		if (!newBibleCitationVersion) {
			new Notice("No version selected.");
			return;
		}


		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			console.error('No active file found');
			return;
		}


		const report = await changeBibleCitationVersionInText(this.app, this.pluginDir, content, newBibleCitationVersion);
		this.notifyReport(report, `updated to version ${newBibleCitationVersion}`);

		if (report.converted > 0) {
			await this.app.vault.modify(activeFile, report.content);
		}
	}

	notifyReport(report: { converted: number, failed: { text: string, error: string }[] }, action: string) {
		let message = `${report.converted} Bible citation(s) ${action}.`;
		if (report.failed.length > 0) {
			message += `\n${report.failed.length} failed: ` + report.failed.map(f => `${f.text} (${f.error})`).join("; ");
		}
		new Notice(message, report.failed.length > 0 ? 8000 : 4000);
	}




	async getBibleVersionFromUserChangeExistingCitationsVersion(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationVersionChangePromptModal(this.app, resolve, this);
			prompt.open();
		});

	}

	async getBibleVersionFromUserPlainTextCitationCase(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationChangePlainTextCitation(this.app, resolve, this);
			prompt.open();
		});

	}



	async createBibleCitation() {
		const citation = await this.getCitationFromUser();
		if (!citation) return;

		try {
			await this.addCitationDiv(citation);
			new Notice(`Added citation: ${citation.reference}`);
		} catch (error) {
			console.error(error);
			new Notice(`Could not add the citation "${citation.reference}": ${error.message}`, 8000);
		}
	}	/* Add this CSS to style the bible citation div and tabs */


	async addCitationDiv(citation: BibleCitation) {
		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) {
			new Notice("No active document found.");
			return;
		}

		const view = activeLeaf.view;
		if (view.getViewType() !== 'markdown') {
			new Notice("Active document is not a markdown file.");
			return;
		}

		const editor = (view as any).editor;
		const cursor = editor.getCursor();

		let got_citation: { citation: string } = await new BibleCitationGetter({ app: this.app, pluginDir: this.pluginDir }).getCitation(citation);
		if (!got_citation) {
			new Notice("Failed to get citation.");
			return;
		}

		editor.replaceRange(got_citation.citation, cursor);

		// if (view)
		// {
		// 	const file = (view as FileView).file;
		// 	if (file) {
		// 		processMarkdownFile(file.path, this.app.vault);
		// 		new Notice("Success in process markdown file");

		// 	} else {
		// 		new Notice("Failed to process markdown file: file is null.");
		// 	}

		// }

	}


	async createFileForCitation(book: string, chapter: string, verse_indice_inf: number, verse_indice_sup: number, version: string): Promise<string | null> {
		const citation = await this.getCitationFromUser();
		if (!citation) return null;

		const fileName = `${book} ${chapter}:${verse_indice_inf}-${verse_indice_sup}.md`;

		const file = await this.createFile(fileName, "");

		if (file) {
			const link = this.generateLink(file);
			this.app.workspace.activeLeaf?.setViewState({
				type: 'markdown',
				state: { file: file.path },
			});
			new Notice(`Created file with citation: ${citation}`);
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

	generateLink(file: TFile): string {
		return `[[${file.path}]]`;
	}
}
