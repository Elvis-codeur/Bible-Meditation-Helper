import { App, MarkdownPostProcessorContext, Modal, Notice, Plugin, TFile, Vault } from "obsidian";

import BibleCitationGetter from "./bible_citation_getter";
import path from "path";
import { BibleCitationPromptModal, BibleCitationVersionChangePromptModal } from "./prompt_modals";
import { TranslateNotes, TranslationModal } from "./translate_not";
import { BibleCitationSettingTab } from './settings-tab';




interface CalloutBlock {
	text: string;
	startIndex: number;
	endIndex: number;
}

function findCalloutsWithIndices(markdown: string): CalloutBlock[] {
	const lines = markdown.split('\n');
	const results: CalloutBlock[] = [];

	let insideCallout = false;
	let calloutStartLine = 0;
	let currentCalloutLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!insideCallout) {
			// Detect callout start line: >[!type] Optional text
			if (/^\s{0,3}>\s*\[!\w+.*?\]/.test(line)) {
				insideCallout = true;
				calloutStartLine = i;
				currentCalloutLines = [line];
			}
		} else {
			// Continue collecting lines starting with >
			if (/^\s{0,3}>\s?.*/.test(line)) {
				currentCalloutLines.push(line);
			} else {
				// End of callout
				const startIndex = getLineOffset(markdown, calloutStartLine);
				const endIndex = getLineOffset(markdown, i);
				results.push({
					text: currentCalloutLines.join('\n'),
					startIndex,
					endIndex
				});
				insideCallout = false;
			}
		}
	}

	// If file ends during a callout
	if (insideCallout) {
		const startIndex = getLineOffset(markdown, calloutStartLine);
		results.push({
			text: currentCalloutLines.join('\n'),
			startIndex,
			endIndex: markdown.length
		});
	}

	return results;
}

// Helper to get character offset from line number
function getLineOffset(text: string, lineNumber: number): number {
	const lines = text.split('\n');
	return lines
		.slice(0, lineNumber)
		.reduce((offset, line) => offset + line.length + 1, 0); // +1 for newline
}




interface BibleCitationPluginSettings {
	openaiApiKey: string;
	claudeApiKey: string;
	geminiApiKey: string;
	deeplApiKey: string;
	googleTranslateApiKey: string;
}

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
			googleTranslateApiKey: ''
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
					googleTranslateApiKey: this.settings.googleTranslateApiKey
				});

				await translator.translateNote(
					activeFile,
					result.service,
					result.targetLang,
					result.customPrompt,
					result.openAIModel
				);

				new Notice(`Translation completed for ${activeFile.basename}`);
			} catch (error) {
				console.error('Translation error:', error);
				new Notice(`Translation failed: ${error.message}`);
			}
		}).open();
	}

	async loadStyles() {
		const cssFile = await this.app.vault.adapter.read(path.join(this.app.vault.configDir,
			"plugins", "Bible-Meditation-Helper", 'styles/citation_callout_style.css'));
		const style = document.createElement('citation_callout_style');
		style.textContent = cssFile;
		document.head.appendChild(style);
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
		let updatedContent = content;


		// Prompt the user to select a new version
		const newBibleCitationVersion = await this.getBibleVersionFromUser();


		if (!newBibleCitationVersion) {
			new Notice("No version selected.");
			return;
		}


		const regex = />\[!bible-meditation-helper-citation]\s+\[\[([^\]]+)\]\]\n((?:>.*\n?)*)/g;

		let matches = [];

		let match;

		while ((match = regex.exec(content)) !== null) {
			const startIndex = match.index;
			const endIndex = regex.lastIndex;

			matches.push({
				reference: match[1],
				text: match[2]
					.split('\n')
					.filter(line => line.startsWith('>'))
					.map(line => line.slice(1).trim())
					.join('\n'),
				startIndex,
				endIndex,
				newReference: [match[1].split("|")[1], newBibleCitationVersion].join("||") // Create a new citation reference with the new bible version requisted
			});
		}


		console.log(matches)

		// Note: We reverse the list to avoid breaking indices as we edit from the back to the front.
		let newContent = content;
		for (const result of matches.reverse()) {
			console.log(result.newReference);
			newContent =
				newContent.slice(0, result.startIndex) +
				(await (new BibleCitationGetter({ app: this.app }).getCitation(result.newReference))).citation +
				newContent.slice(result.endIndex);
		}
		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			console.error('No active file found');
			return;
		}
		await this.app.vault.modify(activeFile, newContent);

		new Notice(`Bible citations updated to version: ${newBibleCitationVersion}`);
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
		let updatedContent = content;


		// Prompt the user to select a new version
		const newBibleCitationVersion = await this.getBibleVersionFromUser();


		if (!newBibleCitationVersion) {
			new Notice("No version selected.");
			return;
		}

		console.log(newBibleCitationVersion);

		// STEP 1: Abbreviations for books (English + French, partial for demo)
		const books = [
			"Gen(?:esis)?", "Ex(?:odus)?", "Lev(?:iticus)?", "Rom(?:ains)?", "1 ?(Cor|Corinthiens?)", "2 ?(Cor|Corinthiens?)",
			"Jean", "John", "Matthieu", "Matthew", "Marc", "Mark", "Luc", "Luke", "Ésaïe", "Isa(?:iah)?",
			"Ps(?:aumes|alms)?", "Prov(?:erbes|erbs)?", "Apoc(?:alypse)?", "Rev(?:elation)?"
		];

		// STEP 2: Build a regex from those books
		const bookRegex = books.join("|");

		// STEP 3: Main pattern - find Book + chapter:verse
		//const bibleRegex = new RegExp(`\\b(?:${bookRegex})\\s+\\d{1,3}(?::\\d{1,3}(?:[-–]\\d{1,3})?)?\\b`, "gi");

		//const regex = /\b(?:[1-3]?\s?[A-Za-zÀ-ÿ]+(?:\s?[A-Za-zÀ-ÿ]+)*)(?:\s?\d{1,3}(:\d{1,3})?(?:-\d{1,3}(:\d{1,3})?)?)\b/g;
		
		const regex = /\b(?:[1-3]?\s?[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿa-zà-ÿ]+)*)(?:\s+\d{1,3}(?::\d{1,3})?(?:-\d{1,3})?)\b/g;


		let nonCalloutTextList = [];

		// The list of the new non callout text with the verse inserted if needed 
		let newNonCalloutTextList = [];

		let calloutList = findCalloutsWithIndices(content)

		//console.log(calloutList);

		if (calloutList.length > 0) {
			// Add a text if it exists before the first callout 
			nonCalloutTextList.push(content.slice(0, calloutList[0].startIndex - 1))

			// Split my text to separate the callouts from the normal text 
			for (var compteur = 1; compteur < calloutList.length; compteur++) {
				nonCalloutTextList.push(content.slice(calloutList[compteur - 1].endIndex, calloutList[compteur].startIndex))
			}

			// Add a text if its exists after the last callout 
			nonCalloutTextList.push(content.slice(calloutList[calloutList.length - 1].endIndex))

		}
		else {
			nonCalloutTextList.push(content)
		}


		var newContentNonCalloutTextList = [];


		for (var nonCalloutText of nonCalloutTextList) {
			// empty the list 
			newContentNonCalloutTextList = [];

			for (var line of nonCalloutText.split("\n")) {
				// If it is not a line of the definition of a callout or not in a callout 
				if (!line.startsWith(line.startsWith(">"))) {
					if (line.match(regex)) {
						let reference = [line, newBibleCitationVersion].join("||");
						try {
							newContentNonCalloutTextList.push((await (new BibleCitationGetter({ app: this.app })).getCitation(reference)).citation)

						}
						// In the case it is not a correct citation
						catch {
							newContentNonCalloutTextList.push(line)
						}
					}
					else {
						newContentNonCalloutTextList.push(line)
					}
				}
				else {

					newContentNonCalloutTextList.push(line);
				}
			}

			newNonCalloutTextList.push(newContentNonCalloutTextList.join("\n"))

		}


		console.log("nonCalloutTextList", nonCalloutTextList)
		console.log("newNonCalloutTextList", newNonCalloutTextList)


		// Recreate the content of the file now that we have added the verse
		// I interleave the callout text and the non callout text back
		let newFileContent = newNonCalloutTextList[0] ?? '';

		newFileContent = newFileContent + "\n\n";

		for (var i = 0; i < calloutList.length; i++) {
			newFileContent += calloutList[i].text + "\n\n";
			newFileContent += newNonCalloutTextList[i + 1] + "\n\n";
		}

		console.log("newFileContent", newFileContent)


		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			console.error('No active file found');
			return;
		}
		await this.app.vault.modify(activeFile, newFileContent);


	}



	async getBibleVersionFromUser(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new BibleCitationVersionChangePromptModal(this.app, resolve);
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
