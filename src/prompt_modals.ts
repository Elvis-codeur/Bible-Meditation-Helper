import { App, Modal } from "obsidian";

class BibleCitationVersionChangePromptModal extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Enter the new Bible version " });
		

		const selectEl = contentEl.createEl("select");
		const versions = ["ESV", "KJV", "LSG10", "BDS"];

		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});


		const submitButton = contentEl.createEl("button", { text: "Submit" });

		submitButton.onclick = () => {
			const bibleVersion = selectEl.value.trim()
            //console.log(bibleVersion);
			this.resolve(bibleVersion || null);

            this.close()
		};

		// Add the element as children 
	
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
		contentEl.createEl("h2", { text: "Enter Bible Citation" });
		const inputEl = contentEl.createEl("input", { type: "text" });
		inputEl.focus();

		const selectEl = contentEl.createEl("select");
		const versions = ["ESV", "KJV", "LSG10", "BDS"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});


		const submitButton = contentEl.createEl("button", { text: "Submit" });

		inputEl.addEventListener("keypress", (event) => {
			if (event.key === "Enter") {
				submitButton.click();
			}
		});


		submitButton.onclick = () => {
			const citation = inputEl.value.trim() + "||" + selectEl.value.trim();
			this.resolve(citation || null);
			this.close();
		};

		// Add the element as children 
		
		contentEl.appendChild(inputEl);
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);

	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}



export {
    BibleCitationPromptModal,
    BibleCitationVersionChangePromptModal
}