import path from "path";

/**
 * A constant string representing the callout identifier for the Bible Meditation Helper plugin.
 * This callout is used to mark citations within the plugin.
 */
const pluginCallout = "[!bible-meditation-helper-citation]";
const defaultFolderInVault = "Bible-Meditation-Helper";
const defaultCitationFolder = path.join(defaultFolderInVault,`citations`);

export { pluginCallout,defaultCitationFolder,defaultFolderInVault };