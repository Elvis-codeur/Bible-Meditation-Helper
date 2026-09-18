/** Language of the Bible versions we know about, used when a version cannot be found in the data folder */
export const KNOWN_VERSION_LANGUAGES: Record<string, string> = {
    "ESV": "en",
    "NIV": "en",
    "KJV": "en",
    "NLT": "en",
    "NRSV": "en",
    "RSV": "en",
    "NASB": "en",
    "ASV": "en",
    "WEB": "en",
    "BBE": "en",
    "DARBY": "en",
    "HNV": "en",
    "WBT": "en",
    "WNT": "en",
    "YLT": "en",
    "RVR1960": "es",
    "LBLA": "es",
    "NVI": "es",
    "RVR1977": "es",
    "RVR1995": "es",
    "TLA": "es",
    "ARC": "pt",
    "ARA": "pt",
    "NVI-PT": "pt",
    "LSG": "fr",
    "LSG10": "fr",
    "NEG": "fr",
    "PDV": "fr",
    "BDS": "fr",
};

export const DEFAULT_VERSIONS = ["ESV", "KJV", "LSG10"];

export interface DirectoryLister {
    list(path: string): Promise<{ files: string[]; folders: string[] }>;
}

export interface BibleVersionInfo {
    version: string;
    language: string;
}

const lastSegment = (path: string) => path.split("/").filter(Boolean).pop() ?? path;

/** List the versions found in <pluginDir>/data/Bible/<language>/<VERSION> */
export async function discoverVersions(adapter: DirectoryLister, pluginDir: string): Promise<BibleVersionInfo[]> {
    const root = `${pluginDir}/data/Bible`;
    const found: BibleVersionInfo[] = [];
    try {
        for (const languageFolder of (await adapter.list(root)).folders) {
            const language = lastSegment(languageFolder);
            for (const versionFolder of (await adapter.list(languageFolder)).folders) {
                found.push({ version: lastSegment(versionFolder), language });
            }
        }
    } catch {
        // No data folder: the caller falls back on the default versions
    }
    return found.sort((a, b) => a.version.localeCompare(b.version));
}

export function languageOfVersion(version: string, discovered: BibleVersionInfo[]): string {
    const name = version.trim().toUpperCase();
    return discovered.find(v => v.version.toUpperCase() === name)?.language
        ?? KNOWN_VERSION_LANGUAGES[name]
        ?? "None";
}
