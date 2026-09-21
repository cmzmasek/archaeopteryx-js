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
    /** Called once per settled redraw when the view changed: the state as
     * getViewState() returns it, and its hash-ready string. */
    onViewChange?: ((state: ViewState, encoded: string) => void) | null;
    /** 'compact' tightens the control panel's spacing and narrows it (the
     * tree's left margin follows). The same controls, nothing hidden. */
    panelDensity?: 'comfortable' | 'compact';
    pngExportScale?: number;
    rootOffset?: number;
    searchAinitialValue?: string | null;
    searchBinitialValue?: string | null;
    /** Open with the heat map shown. Default false: it is offered whenever
     * the tree has two or more numeric per-tip fields, which is most annotated
     * trees, so it waits to be asked for. */
    /** How the heat map's columns are ordered. The clustered modes also draw
     * the dendrogram above the matrix. Default 'document'. */
    heatmapColumnOrder?: 'document' | 'clustered' | 'clustered-presence' | 'alphabetical' | 'frequency';
    showHeatmap?: boolean;
    showMsa?: boolean;
    showSupportDots?: boolean;
    showTimeAxis?: boolean;
    supportDotMinimum?: number;
    timeAxisGrid?: boolean;
    /** Open straight into a view (getViewState / decodeViewState). */
    view?: ViewState | null;
    visualizationsLegendXpos?: number;
    visualizationsLegendYpos?: number;
    zoomToFitUponWindowResize?: boolean;
}

/** One search box in a view: the field by its menu label, the mode, the
 * value (and the range's second value). */
export interface ViewSearch {
    field?: string;
    mode?: string;
    value: string;
    value2?: string;
}

/** A view of a tree as the control panel left it: what getViewState()
 * returns, what the config's view key and applyViewState() take, and what
 * encodeViewState() / decodeViewState() turn into a URL-hash string and
 * back. Every key is optional; a key left out keeps its current value,
 * except searchA / searchB, which an absent key clears. Nodes (subtree,
 * collapsed) are named by their launch-time preorder index. */
export interface ViewState {
    /** Which tree of a multi-tree launch (0-based). */
    tree?: number;
    layout?: Layout;
    display?: 'phylogram' | 'aligned' | 'cladogram';
    /** The ladderize direction applied. */
    order?: 'asc' | 'desc';
    /** Re-rooted: at the midpoint, or by minimal ancestor deviation. */
    root?: 'midpoint' | 'mad';
    subtree?: number;
    collapsed?: number[];
    /** A visualization id (as the Color-by menu values them), or 'none'. */
    colorBy?: string;
    shapeBy?: string;
    /** The panel's checked boxes: name, taxonomy, sequence, confidence,
     * madValues, branchLength, external, internal, nodeEvents, branchEvents,
     * supportDots, shortNames, autoHide, visualizations, visualStyles, and
     * custom:<key> for a nodeLabels checkbox. */
    show?: string[];
    font?: number;
    node?: number;
    branch?: number;
    /** Radial rotation in button presses (pi/32 each). */
    rotation?: number;
    horizontalLabels?: boolean;
    msa?: boolean;
    heatmap?: boolean;
    heatmapOrder?: 'document' | 'clustered' | 'clustered-presence' | 'alphabetical' | 'frequency';
    domains?: boolean;
    domainLabels?: 'none' | 'domains' | 'legend';
    domainGlow?: boolean;
    domainEvalue?: number;
    timeAxis?: boolean;
    timeGrid?: boolean;
    searchA?: ViewSearch;
    searchB?: ViewSearch;
    combine?: 'and' | 'or';
    matchCase?: boolean;
    inverse?: boolean;
}

/** What launch() returns: the per-viewer surface an embedder needs after
 * launching. */
export interface ViewerHandle {
    /** The nodes the user has selected via the node menu (when
     * enableManualNodeSelection is on). */
    getSelectedNodes(): PhylogenyNode[];
    /** How many trees the launch holds: one, or every tree the file held
     * (launch() with the array parseTrees returns). */
    getTreeCount(): number;
    /** Which of them is shown (0-based). */
    getTreeIndex(): number;
    /** Shows another tree of the launch in the same container under the
     * same config: as you left it, or -- a tree not opened yet -- on its own
     * presets in the current layout and sizes. Returns the handle for the
     * new viewer. */
    showTree(index: number): ViewerHandle;
    /** The view as the panel left it (see ViewState). */
    getViewState(): ViewState;
    /** Opens a view on the running viewer; a view of another tree of the
     * launch relaunches into that tree. */
    applyViewState(state: ViewState): void;
    /** Unmounts the viewer completely: the DOM inside the container, the
     * body-level pieces, the window resize listener and every page-level
     * key/wheel handler. A later launch() works normally. */
    destroy(): void;
}

/** How bare numeric internal labels of a Newick / Nexus tree are read:
 * 'auto' decides per tree, 'confidence' takes every one as a support
 * value, 'label' keeps them as names. */
export type InternalNumericLabels = 'auto' | 'confidence' | 'label';

export interface Archaeopteryx {
    /** Launch the viewer into a container (a CSS selector or the element
     * itself; an unresolvable container throws). Exactly three arguments.
     * A tree, or every tree of a file (parseTrees): the first is shown and
     * the control panel gets a picker for the others. */
    launch(container: string | Element, tree: Phylogeny | Phylogeny[], config?: ArchaeopteryxConfig): ViewerHandle;

    /** Parse-and-launch in one step. Fetch the file content yourself; the
     * fileName picks the parser (extension; content is sniffed too).
     * Exactly four arguments. */
    launchArchaeopteryx(container: string | Element, fileName: string, data: string,
        config?: ArchaeopteryxConfig): ViewerHandle;

    /** Parse tree data, auto-detecting the format from content and fileName:
     * Nexus (#NEXUS / .nex / .nexus), Auspice/Nextstrain v2 JSON ({ / .json),
     * phyloXML (*xml), otherwise New Hampshire (Newick). The FIRST tree the
     * data holds; parseTrees returns them all. */
    parseTree(fileName: string, data: string,
        internalNumericLabels?: InternalNumericLabels): Phylogeny;
    /** Every tree the data holds, in file order: a Nexus TREES block, a
     * Newick text with one tree per ';', a phyloXML with several
     * phylogenies (an Auspice dataset is one tree). Hand the array to
     * launch(). */
    parseTrees(fileName: string, data: string,
        internalNumericLabels?: InternalNumericLabels): Phylogeny[];

    parsePhyloXML(data: string): Phylogeny;
    parseNewHampshire(data: string,
        internalNumericLabels?: InternalNumericLabels): Phylogeny;
    /** A Nexus file can hold several trees; the FIRST is returned
     * (parseTrees returns them all). */
    parseNexus(data: string,
        internalNumericLabels?: InternalNumericLabels): Phylogeny;
    parseAuspiceJson(data: string | object): Phylogeny;

    /** Module-level twin of the handle's getSelectedNodes. */
    getSelectedNodes(): PhylogenyNode[];

    /** A view as a "key=value&..." string for a URL hash, and back. decode
     * accepts a leading '#', ignores what it does not know, and returns
     * null for nothing. */
    encodeViewState(state: ViewState): string;
    decodeViewState(text: string | null | undefined): ViewState | null;
}

export const archaeopteryx: Archaeopteryx;

declare global {
    interface Window {
        /** Set by the script-tag and AMD loading paths. */
        archaeopteryx: Archaeopteryx;
    }
}
