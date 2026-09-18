import { Notice } from "obsidian";

/** What the modals need from the plugin to know the Bible versions and the preferred one */
export interface VersionHost {
	getBibleVersions(): Promise<string[]>;
	preferredVersionStore: {
		get: () => string | undefined;
		set: (version: string) => void | Promise<void>;
	};
}

/**
 * Render the Bible versions as a row of buttons. A click selects a version, a double click also makes
 * it the preferred one (marked with a star and selected by default the next time).
 */
export async function renderVersionPicker(container: HTMLElement, host?: VersionHost) {
	const versions = host ? await host.getBibleVersions() : ["ESV", "KJV", "LSG10"];
	const preferred = () => host?.preferredVersionStore.get();
	let selected = versions.find(v => v === preferred()) ?? versions[0];

	const picker = container.createDiv({ cls: "bmh-version-picker" });
	const buttons = new Map<string, HTMLElement>();

	const refresh = () => {
		buttons.forEach((button, version) => {
			button.toggleClass("bmh-selected", version === selected);
			button.setText(version === preferred() ? `★ ${version}` : version);
		});
	};

	versions.forEach(version => {
		const button = picker.createDiv({ cls: "bmh-version-card", text: version });
		button.title = "Click to select, double click to make it your preferred version";
		button.onclick = () => { selected = version; refresh(); };
		button.ondblclick = async () => {
			selected = version;
			if (host) {
				await host.preferredVersionStore.set(version);
				new Notice(`${version} is now your preferred Bible version`);
			}
			refresh();
		};
		buttons.set(version, button);
	});
	refresh();

	return { getValue: () => selected, element: picker };
}
