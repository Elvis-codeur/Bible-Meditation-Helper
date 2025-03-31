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
						key: "l", // You can change this to any key you prefer
					},
				],
			}
		)



		this.registerMarkdownCodeBlockProcessor("html", (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			console.log("Elvis est un enfant de Dieu")
			const myDropdown = el.querySelector("#select_bible_version_dropdown") as HTMLSelectElement;

			if (myDropdown) {
				myDropdown.addEventListener("change", function () {
					console.log("Selected Bible Version:", myDropdown.value);
				});
			}
		});

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

	 
	
async changebibleCitationInTheDocument(content:string,newBibleCitationVersion:string) {
		// Find all [!bible] blocks using a regex
		const bibleBlockRegex = /\[!bible-meditation-helper-citation\](.*?)\n([\s\S]*?)\n/g;
		const matches = [...content.matchAll(bibleBlockRegex)];

		if (matches.length === 0) {
			new Notice("No Bible citations found in the document.");
			return;
		}

		// Replace the version in each [!bible] block
		let result: [string, string][] = [];

		matches.forEach(async match => {
			const fullBlock = match[0];
			let citationLine = fullBlock.split("\n")[0]
			const oldBibleCitationVersion = this.extractBibleVersion(fullBlock) || "";

			// Replace the old citation with a new one 
			citationLine = citationLine.replace(oldBibleCitationVersion, newBibleCitationVersion.trim())

			//console.log("New citation line =  ", citationLine);

			// Get the citation to create new citation with the new bible version 

			let citation = citationLine.split("[[")[1].split("|")[1];


			let got_citation: { citation: string } = await new BibleCitationGetter({ app: this.app }).getCitation(
				citation + "||" + newBibleCitationVersion);

			result.push([fullBlock,got_citation.citation])


			
		});
		return result;

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
		let updatedContent =  content; 
		

		// Prompt the user to select a new version
		const newBibleCitationVersion = await this.getBibleVersionFromUser();


		if (!newBibleCitationVersion) {
			new Notice("No version selected.");
			return;
		}

		let old_citation_and_new_citation  = await this.changebibleCitationInTheDocument(content,newBibleCitationVersion);
		

		old_citation_and_new_citation?.map((value)=>{
			updatedContent = updatedContent.replace(value[0],value[1]);
		})


		console.log(updatedContent);
		// Update the editor content
		editor.setValue(updatedContent);


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
