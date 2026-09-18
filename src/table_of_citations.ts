import { TFile, Vault } from "obsidian";

async function processMarkdownFile(filePath: string, vault: Vault) {
    // Read the file from Obsidian Vault
    const file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) return;

    const content = await vault.read(file);

    // Regex to find all `[!bible]` callouts
    const bibleCitations = [...content.matchAll(/\[!bible-meditation-helper-citation\] \[(.*?)\]/g)].map(match => match[1]);

    if (bibleCitations.length === 0) return; // No citations found

    // Generate the table of citations
    const citationTable = generateCitationTable(bibleCitations);

    // Insert table at the top of the document
    const newContent = `${citationTable}\n\n${content}`;

    // Save the updated content back
    await vault.modify(file, newContent);
}

function generateCitationTable(citations: string[]): string {
    let table = `| # | Bible Reference |\n|---|----------------|\n`;
    citations.forEach((citation, index) => {
        table += `| ${index + 1} | [[${citation}]] |\n`;
    });
    return table;
}

export { processMarkdownFile };