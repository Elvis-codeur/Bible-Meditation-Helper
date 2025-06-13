import { App, MarkdownPostProcessorContext, Modal, Notice, Plugin, TFile, Vault } from "obsidian";

import BibleCitationGetter from "./bible_citation_getter";
import path from "path";
import { BibleCitationPromptModal, BibleCitationVersionChangePromptModal } from "./prompt_modals";



const cheerio = require('cheerio');



export default class BibleCitationPlugin extends Plugin {
	async onload() {

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

		this.loadStyles();
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
