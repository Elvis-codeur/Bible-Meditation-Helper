import { App, MarkdownPostProcessorContext, Modal, Notice, Plugin, TFile, Vault } from "obsidian";

import BibleCitationGetter, { changeBibleCitationVersionInText, convertPlainCitationsToPluggingCitationsInText } from "./bible_citation_getter";
import path from "path";
import { BibleCitationChangePlainTextCitation, BibleCitationPromptModal, BibleCitationVersionChangePromptModal } from "./prompt_modals";
import { TranslateNotes, } from "./translate_not";
import {TranslationModal} from "./prompt_modals"
import { BibleCitationSettingTab } from './settings-tab';
import { BibleCitationPluginSettings, CalloutBlock } from "./type_definitions";













export default class BibleCitationPlugin extends Plugin {
	settings: BibleCitationPluginSettings;

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
			customTranslationPrompts: []  // initialize with empty array
		}, await this.loadData());
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


		this.loadStyles();
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
					translationsOutputFolder:this.settings.translationsOutputFolder,
					
				});

				await translator.translateNote(
					activeFile,
					result.service,
					result.targetLang,
					result.bibleVersion,
					result.customPrompt,
					result.iaModel
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
		const cssFile = await this.app.vault.adapter.read(path.join(this.app.vault.configDir,
			"plugins", "Bible-Meditation-Helper", 'styles/citation_callout_style.css'));
		const style = document.createElement('citation_callout_style');
		style.textContent = cssFile;
		document.head.appendChild(style);
	}

	async convertPlainCitationsToPluggingCitations()
	{
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

		let newFileContent = await convertPlainCitationsToPluggingCitationsInText(content,newBibleCitationVersion);

		await this.app.vault.modify(activeFile, newFileContent);


		//console.log(newBibleCitationVersion);

	}


	async getCitationFromUser(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationPromptModal(this.app, resolve);
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


		let newContent = await changeBibleCitationVersionInText(content,newBibleCitationVersion);

		await this.app.vault.modify(activeFile, newContent);

		new Notice(`Bible citations updated to version: ${newBibleCitationVersion}`);
	}

	


	async getBibleVersionFromUserChangeExistingCitationsVersion(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationVersionChangePromptModal(this.app, resolve);
			prompt.open();
		});

	}

	async getBibleVersionFromUserPlainTextCitationCase(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationChangePlainTextCitation(this.app, resolve);
			prompt.open();
		});

	}



	async createBibleCitation() {
		const citation = await this.getCitationFromUser();
		if (!citation) return;

		this.addCitationDiv(citation);
		new Notice(`Added citation: ${citation}`);
	}	/* Add this CSS to style the bible citation div and tabs */


	async addCitationDiv(citation: string) {
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

		let got_citation: { citation: string } = await new BibleCitationGetter({ app: this.app }).getCitation(citation);
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
