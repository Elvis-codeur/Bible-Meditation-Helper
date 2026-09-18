import { App, Modal, Notice, TextAreaComponent, TextComponent } from "obsidian";
import { TranslationModel, TranslationService } from "./type_definitions";

const BIBLE_VERSIONS = ["ESV", "KJV", "LSG10"];

/** Lets the modals read and store the version the user prefers (double click on a version). */
interface PreferredVersionStore {
	get: () => string | undefined;
	set: (version: string) => void | Promise<void>;
}

/**
 * Render the Bible versions as a row of buttons (no dropdown, so nothing can cover them).
 * A click selects a version, a double click also makes it the preferred one.
 */
function renderVersionPicker(container: HTMLElement, store?: PreferredVersionStore) {
	let selected = store?.get() && BIBLE_VERSIONS.includes(store.get() as string) ? store.get() as string : BIBLE_VERSIONS[0];
	const picker = container.createDiv({ cls: "bmh-version-picker" });
	const buttons = new Map<string, HTMLButtonElement>();

	const refresh = () => {
		buttons.forEach((button, version) => {
			button.toggleClass("mod-cta", version === selected);
			button.setText(version === store?.get() ? `★ ${version}` : version);
		});
	};

	BIBLE_VERSIONS.forEach(version => {
		const button = picker.createEl("button", { text: version, cls: "bmh-version-button" });
		button.title = "Click to select, double click to make it your preferred version";
		button.onclick = () => { selected = version; refresh(); };
		button.ondblclick = async () => {
			selected = version;
			if (store) {
				await store.set(version);
				new Notice(`${version} is now your preferred Bible version`);
			}
			refresh();
		};
		buttons.set(version, button);
	});
	refresh();

	return { getValue: () => selected };
}

function styleSubmit(button: HTMLButtonElement) {
	button.addClass("mod-cta");
	button.style.marginTop = "12px";
}

class BibleCitationVersionChangePromptModal extends Modal {
	constructor(app: App, private resolve: (value: string | null) => void, private store?: PreferredVersionStore) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Change the version of your Bible citations" });
		contentEl.createEl("p", {
			text: "Choose the Bible version to which you want to convert your Bible citations (double click to set your preferred version)"
		}).addClass("bmh-modal-description");

		const picker = renderVersionPicker(contentEl, this.store);
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		styleSubmit(submitButton);
		submitButton.onclick = () => {
			this.resolve(picker.getValue() || null);
			this.close();
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}

class BibleCitationChangePlainTextCitation extends Modal {
	constructor(app: App, private resolve: (value: string | null) => void, private store?: PreferredVersionStore) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Convert plain citations" });
		contentEl.createEl("p", {
			text: "Choose the Bible version in which you want your plain citations to be cited (double click to set your preferred version)"
		}).addClass("bmh-modal-description");

		const picker = renderVersionPicker(contentEl, this.store);
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		styleSubmit(submitButton);
		submitButton.onclick = () => {
			this.resolve(picker.getValue() || null);
			this.close();
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}

class BibleCitationPromptModal extends Modal {
	private submitted = false;

	constructor(app: App, private resolve: (value: string | null) => void, private store?: PreferredVersionStore) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Enter Bible Citation" });
		contentEl.createEl("p", {
			text: "Enter a Bible verse (e.g. John 3:16, John 3:16-18 or John 3:16,18,20–22) and choose a version (double click to set your preferred version).",
		}).addClass("bmh-modal-description");

		const inputEl = contentEl.createEl("input", { type: "text", placeholder: "e.g. John 3:16", cls: "bmh-citation-input" });
		inputEl.focus();

		const picker = renderVersionPicker(contentEl, this.store);
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		styleSubmit(submitButton);

		inputEl.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				submitButton.click();
			}
		});

		submitButton.onclick = () => {
			this.submitted = true;
			this.resolve(inputEl.value.trim() + "||" + picker.getValue());
			this.close();
		};
	}

	onClose() {
		// Resolve the pending promise when the modal is dismissed without submitting
		if (!this.submitted) this.resolve(null);
		this.contentEl.empty();
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
