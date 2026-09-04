// Type definitions for archaeopteryx (archaeopteryx.js)
// The public embedding surface only. The tree-object shape is the phyloXML
// model as produced by the bundled parsers; it is deliberately typed loosely
// (every element is optional, extra fields allowed) because trees round-trip
// through several formats.

/** A node of the phylogeny (the phyloXML-shaped tree model). The tree handed
 * to launch() is the "super-root": an object whose children array holds the
 * real root. Every parser in this package returns that shape. */
export interface PhylogenyNode {
    name?: string;
    branch_length?: number;
    children?: PhylogenyNode[];
    parent?: PhylogenyNode;
    confidences?: Array<{ type?: string; value?: number; stddev?: number }>;
    taxonomies?: Array<Record<string, unknown>>;
    sequences?: Array<Record<string, unknown>>;
    properties?: Array<{ ref: string; value: string; datatype?: string; applies_to?: string }>;
    date?: { value?: number; minimum?: number; maximum?: number; unit?: string; desc?: string };
    [key: string]: unknown;
}

/** A parsed phylogeny: the super-root. Also a PhylogenyNode structurally. */
export interface Phylogeny extends PhylogenyNode {
    children: PhylogenyNode[];
    rooted?: boolean;
    description?: string;
}

export type Layout = 'rectangular' | 'circular' | 'unrooted';

/** One custom label-field entry (the config's nodeLabels values).
 *
 * Two modes:
 *  - a PANEL CHECKBOX needs label, description AND propertyRef set, plus
 *    showButton: true -- omit showButton (or any of the three) and no
 *    checkbox appears;
 *  - HEADLESS labelling: selected: true with propertyRef (no showButton)
 *    labels the nodes with the property's value, with no checkbox offered.
 *
 * The config is deep-copied at launch: the viewer's runtime state never
 *  writes back into the caller's object. */
export interface NodeLabelSpec {
    /** The checkbox's caption in the control panel. */
    label?: string;
    /** Its tooltip. Required (with label and propertyRef) for the checkbox to appear. */
    description?: string;
    /** The node property ref whose value is shown as the label. */
    propertyRef?: string;
    /** true to offer the checkbox at all. */
    showButton?: boolean;
    /** Start (or run) with the labelling on. */
    selected?: boolean;
}

/** The ONE config object. Every key is optional; an unknown or removed key
 * makes launch() throw (deliberately -- a config entry that quietly does
 * nothing is the bug that costs an afternoon). */
export interface ArchaeopteryxConfig {
    collapseControlPanel?: boolean;
    displayHeight?: number;
    displayWidth?: number;
    enableAccessToDatabases?: boolean;
    enableDownloads?: boolean;
    enableDynamicSizing?: boolean;
    enableManualNodeSelection?: boolean;
    enableSubtreeDeletion?: boolean;
    enableVisualizations?: boolean;
    initialVisualization?: string | null;
    ladderizeTree?: boolean;
    layout?: Layout;
    nhConfidenceValuesAsInternalNames?: boolean;
    nhConfidenceValuesInBrackets?: boolean;
    nhExportWriteConfidences?: boolean;
    nodeLabels?: Record<string, NodeLabelSpec> | null;
    pngExportScale?: number;
    rootOffset?: number;
    searchAinitialValue?: string | null;
    searchBinitialValue?: string | null;
    showMsa?: boolean;
    showSupportDots?: boolean;
    showTimeAxis?: boolean;
    supportDotMinimum?: number;
    timeAxisGrid?: boolean;
    visualizationsLegendXpos?: number;
    visualizationsLegendYpos?: number;
    zoomToFitUponWindowResize?: boolean;
}

/** What launch() returns: the per-viewer surface an embedder needs after
 * launching. */
export interface ViewerHandle {
    /** The nodes the user has selected via the node menu (when
     * enableManualNodeSelection is on). */
    getSelectedNodes(): PhylogenyNode[];
    /** Unmounts the viewer completely: the DOM inside the container, the
     * body-level pieces, the window resize listener and every page-level
     * key/wheel handler. A later launch() works normally. */
    destroy(): void;
}

export interface Archaeopteryx {
    /** Launch the viewer into a container (a CSS selector or the element
     * itself; an unresolvable container throws). Exactly three arguments. */
    launch(container: string | Element, tree: Phylogeny, config?: ArchaeopteryxConfig): ViewerHandle;

    /** Parse-and-launch in one step. Fetch the file content yourself; the
     * fileName picks the parser (extension; content is sniffed too).
     * Exactly four arguments. */
    launchArchaeopteryx(container: string | Element, fileName: string, data: string,
        config?: ArchaeopteryxConfig): ViewerHandle;

    /** Parse tree data, auto-detecting the format from content and fileName:
     * Nexus (#NEXUS / .nex / .nexus), Auspice/Nextstrain v2 JSON ({ / .json),
     * phyloXML (*xml), otherwise New Hampshire (Newick). */
    parseTree(fileName: string, data: string,
        nhConfidenceValuesInBrackets?: boolean,
        nhConfidenceValuesAsInternalNames?: boolean): Phylogeny;

    parsePhyloXML(data: string): Phylogeny;
    parseNewHampshire(data: string,
        confidenceValuesInBrackets?: boolean,
        confidenceValuesAsInternalNames?: boolean): Phylogeny;
    /** A Nexus file can hold several trees; the FIRST is returned. */
    parseNexus(data: string,
        confidenceValuesInBrackets?: boolean,
        confidenceValuesAsInternalNames?: boolean): Phylogeny;
    parseAuspiceJson(data: string | object): Phylogeny;

    /** Module-level twin of the handle's getSelectedNodes. */
    getSelectedNodes(): PhylogenyNode[];
}

export const archaeopteryx: Archaeopteryx;

declare global {
    interface Window {
        /** Set by the script-tag and AMD loading paths. */
        archaeopteryx: Archaeopteryx;
    }
}
