import { App, Modal, Notice, TextAreaComponent, TextComponent } from "obsidian";
import { TranslationModel, TranslationService } from "./type_definitions";

class BibleCitationVersionChangePromptModal extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;

		// Title
		contentEl.createEl("h2", { text: "Enter the new Bible version : Change the version of your Bible citations in the text"  });

		// Description
		const description = contentEl.createEl("p", {
			text: "Choose the bible version to which you want convert your bible citations "
		});
		description.style.marginBottom = "50px";
		description.style.fontStyle = "italic";
		description.style.color = "#667";
		description.style.fontSize = "15px";

		// Select element
		const selectEl = contentEl.createEl("select");
		selectEl.style.padding = "8px";
		selectEl.style.margin = "10px 0";
		selectEl.style.width = "100%";
		selectEl.style.border = "1px solid #ccc";
		selectEl.style.borderRadius = "4px";
		selectEl.style.height = "70px";
		selectEl.style.boxSizing = "border-box";

		const versions = ["ESV", "KJV", "LSG10"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});

		// Submit button
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.style.marginTop = "12px";
		submitButton.style.padding = "8px 16px";
		submitButton.style.backgroundColor = "#3a7bfd";
		submitButton.style.color = "#fff";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "4px";
		submitButton.style.cursor = "pointer";

		submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
		submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

		// Submit logic
		submitButton.onclick = () => {
			const bibleVersion = selectEl.value.trim();
			this.resolve(bibleVersion || null);
			this.close();
		};

		// Append elements to panel
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);


	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}




class BibleCitationChangePlainTextCitation extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;

		// Title
		contentEl.createEl("h2", { text: "Enter the Bible version to which you want your plain citations to be cited in" });

		// Description
		const description = contentEl.createEl("p", {
			text: "Choose the bible version in which you want your plain citations to be cited in"
		});
		description.style.marginBottom = "50px";
		description.style.fontStyle = "italic";
		description.style.color = "#667";
		description.style.fontSize = "15px";

		// Select element
		const selectEl = contentEl.createEl("select");
		selectEl.style.padding = "8px";
		selectEl.style.margin = "10px 0";
		selectEl.style.width = "100%";
		selectEl.style.border = "1px solid #ccc";
		selectEl.style.borderRadius = "4px";
		selectEl.style.height = "100px";
		selectEl.style.boxSizing = "border-box";

		const versions = ["ESV", "KJV", "LSG10"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});

		// Submit button
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.style.marginTop = "12px";
		submitButton.style.padding = "8px 16px";
		submitButton.style.backgroundColor = "#3a7bfd";
		submitButton.style.color = "#fff";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "4px";
		submitButton.style.cursor = "pointer";

		submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
		submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

		// Submit logic
		submitButton.onclick = () => {
			const bibleVersion = selectEl.value.trim();
			this.resolve(bibleVersion || null);
			this.close();
		};

		// Append elements to panel
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);


	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


class BibleCitationPromptModal extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {

		const { contentEl } = this;

		// Title
		contentEl.createEl("h2", { text: "Enter Bible Citation" });

		// Description
		const description = contentEl.createEl("p", {
			text: "Please enter a Bible verse (e.g., John 3:16) and choose a version.",
		});
		description.style.marginBottom = "12px";
		description.style.fontStyle = "italic";
		description.style.color = "#667";

		// Input element
		const inputEl = contentEl.createEl("input", { type: "text", placeholder: "e.g. John 3:16" });
		inputEl.style.padding = "8px";
		inputEl.style.marginBottom = "10px";
		inputEl.style.width = "100%";
		inputEl.style.border = "1px solid #ccc";
		inputEl.style.borderRadius = "4px";
		inputEl.style.boxSizing = "border-box";
		inputEl.style.height = "70px"
		inputEl.focus();

		// Select element
		const selectEl = contentEl.createEl("select");
		selectEl.style.padding = "6px";
		selectEl.style.margin = "10px 0";
		selectEl.style.border = "1px solid #ccc";
		selectEl.style.borderRadius = "4px";
		selectEl.style.width = "100%";

		const versions = ["ESV", "KJV", "LSG10"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});

		// Submit button
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.style.marginTop = "12px";
		submitButton.style.padding = "8px 16px";
		submitButton.style.backgroundColor = "#3a7bfd";
		submitButton.style.color = "#fff";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "4px";
		submitButton.style.cursor = "pointer";

		submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
		submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

		// Keyboard shortcut (Enter)
		inputEl.addEventListener("keypress", (event) => {
			if (event.key === "Enter") {
				submitButton.click();
			}
		});

		// Submit logic
		submitButton.onclick = () => {
			const citation = inputEl.value.trim() + "||" + selectEl.value.trim();
			this.resolve(citation || null);
			this.close();
		};

		// Append elements to panel
		contentEl.appendChild(inputEl);
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);


	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}




class TranslationModal extends Modal {
	private result: {
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		model?: TranslationModel;
	};

	private onSubmit: (result: {
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		openAIModel?: TranslationModel;
	}) => void;

	constructor(app: App, onSubmit: (result: {
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		iaModel?: TranslationModel;
	}) => void,
		private savedPrompts: string[] = [] // pass from plugin

	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h3', { text: 'Translation Settings' });

		// Helper to create consistent form groups
		const createFormGroup = (labelText: string, element: HTMLElement) => {
			const group = contentEl.createDiv({ cls: 'translation-form-group' });
			group.createEl('label', { text: labelText });
			group.appendChild(element);
			group.setAttr('style', 'margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;');
		};

		// Service selection
		const serviceSelect = createEl('select', {
			attr: { style: 'padding: 6px; font-size: 14px; width: 100%;' }
		});
		['chatgpt', 'claude', 'gemini', 'google', 'deepl'].forEach(service => {
			serviceSelect.createEl('option', { text: service, value: service });
		});
		createFormGroup('Translation Service', serviceSelect);

		// Model selection (dynamic)
		const modelContainer = contentEl.createDiv({ attr: { style: 'margin-bottom: 16px;' } });
		const modelLabel = modelContainer.createEl('label', { text: 'Model' });
		modelLabel.setAttr('style', 'margin-bottom: 4px; display: block;');
		const modelSelect = modelContainer.createEl('select', {
			attr: { style: 'padding: 6px; font-size: 14px; width: 100%;' }
		});
		modelContainer.style.display = 'none'; // Hidden initially

		// Model list by service
		const modelsByService: Record<TranslationService, TranslationModel[]> = {
			chatgpt: [
				'gpt-4',
				'gpt-4o',
				'o1',
				'o3',
				'gpt-3.5-turbo',
				'gpt-4-0125-preview',
				'gpt-4-turbo-preview',
				'gpt-4-1106-preview',
			],
			claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
			gemini: ['gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemma-7b', 'gemma-2b'],
			google: [],
			deepl: []
		};

		const updateModelOptions = (service: TranslationService) => {
			modelSelect.innerHTML = '';
			const models = modelsByService[service];
			if (models.length > 0) {
				modelContainer.style.display = 'block';
				models.forEach(model => {
					const option = modelSelect.createEl('option', {
						text: model,
						value: model
					});
					if (service === 'chatgpt' && model === 'gpt-4') {
						option.selected = true;
					}
				});
			} else {
				modelContainer.style.display = 'none';
			}
		};

		serviceSelect.addEventListener('change', () => {
			updateModelOptions(serviceSelect.value as TranslationService);
		});
		updateModelOptions(serviceSelect.value as TranslationService);

		// Append model container only once
		contentEl.appendChild(modelContainer);

		// Target language input
		const langInput = new TextComponent(contentEl);
		langInput.setPlaceholder('e.g., fr, es, de');
		langInput.inputEl.style.padding = '6px';
		langInput.inputEl.style.fontSize = '14px';
		langInput.inputEl.style.width = '100%';
		createFormGroup('Target Language', langInput.inputEl);


		// Prompt selector
		contentEl.createEl('label', { text: 'Choose Saved Prompt' });
		const promptSelect = contentEl.createEl('select');
		promptSelect.createEl('option', { text: '-- Select a saved prompt --', value: '' });

		this.savedPrompts.forEach((prompt, i) => {
			promptSelect.createEl('option', {
				text: prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt,
				value: i.toString()
			});
		});

		// Update prompt input to be set dynamically:

		const promptInput = new TextAreaComponent(contentEl)
			.setPlaceholder('Enter custom translation instructions');

		// Add styles
		promptInput.inputEl.style.width = '100%';          // full width
		promptInput.inputEl.style.minHeight = '80px';      // taller textarea
		promptInput.inputEl.style.resize = 'vertical';     // allow vertical resize only
		promptInput.inputEl.style.padding = '8px';         // some padding
		promptInput.inputEl.style.fontSize = '14px';       // readable font size
		promptInput.inputEl.style.borderRadius = '4px';    // rounded corners
		promptInput.inputEl.style.border = '1px solid #ccc'; // subtle border
		promptInput.inputEl.style.marginTop = '8px';       // spacing above textarea

		promptSelect.addEventListener('change', () => {
			const selected = promptSelect.value;
			if (selected !== '') {
				promptInput.setValue(this.savedPrompts[parseInt(selected)]);
			}
		});



		// Submit button
		const submitBtn = contentEl.createEl('button', {
			text: 'Translate',
			cls: 'mod-cta'
		});
		submitBtn.setAttr('style', 'margin-top: 12px; padding: 8px 16px; font-size: 14px;');

		submitBtn.onclick = async () => {
			const targetLang = langInput.getValue().trim();
			if (!targetLang) {
				new Notice('Please enter a target language code (e.g., fr, es, de)');
				return;
			}

			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile) {
				new Notice('No active file to translate');
				return;
			}

			const service = serviceSelect.value as TranslationService;
			const model = modelSelect.value as TranslationModel;

			try {
				this.result = {
					service,
					targetLang,
					customPrompt: promptInput.getValue(),
					model: modelsByService[service].length > 0 ? model : undefined
				};
				this.onSubmit(this.result);
				this.close();
			} catch (error) {
				console.error('Translation error:', error);
				new Notice(`Translation failed: ${error.message}`);
			}
		};

		contentEl.appendChild(submitBtn);
	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}




export {
	BibleCitationPromptModal,
	BibleCitationVersionChangePromptModal,
	TranslationModal,
	BibleCitationChangePlainTextCitation
}
