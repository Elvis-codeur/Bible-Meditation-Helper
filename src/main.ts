import { App, MarkdownPostProcessor, MarkdownPostProcessorContext, Modal, Notice, Plugin, TFile, Vault } from "obsidian";


import axios from 'axios';
import BibleCitationGetter from "./bible_citation_getter";
import path from "path";



const cheerio = require('cheerio');




export default class BibleCitationPlugin extends Plugin {
	async onload() {
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
			 "plugins", "Bible-Meditation-Helper",'src/styles/citation_styles.css'));
		const style = document.createElement('style');
		style.textContent = cssFile;
		document.head.appendChild(style);
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


		let divContent = await new BibleCitationGetter({ vault: this.app.vault }).getCitation(citation);


		editor.replaceRange(divContent, cursor);
	}


	async createFileForCitation() {
		const citation = await this.getCitationFromUser();
		if (!citation) return;

		const fileName = `${citation}.md`;
		const fileContent = `# ${citation}\n\nYour meditation content here...`;

		const file = await this.createFile(fileName, fileContent);
		if (file) {
			const link = this.generateLink(file);
			this.app.workspace.activeLeaf?.setViewState({
				type: 'markdown',
				state: { file: file.path },
			});
			new Notice(`Created file with citation: ${citation}`);
		}
	}

	async getCitationFromUser(): Promise<string | null> {
		return new Promise((resolve) => {
			const prompt = new PromptModal(this.app, resolve);
			prompt.open();
		});
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

class PromptModal extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Enter Bible Citation" });

		const inputEl = contentEl.createEl("input", { type: "text" });
		inputEl.focus();

		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.onclick = () => {
			const citation = inputEl.value.trim();
			this.resolve(citation || null);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


