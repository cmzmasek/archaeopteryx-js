import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

import org.forester.archaeopteryx.tools.RepresentativeTipSelector;
import org.forester.archaeopteryx.tools.RepresentativeTipSelector.RepresentativePick;
import org.forester.archaeopteryx.tools.RepresentativeTipSelector.SelectionResult;
import org.forester.io.parsers.nhx.NHXParser;
import org.forester.phylogeny.Phylogeny;
import org.forester.phylogeny.PhylogenyMethods;
import org.forester.phylogeny.PhylogenyNode;
import org.forester.phylogeny.data.PhylogenyDataUtil;
import org.forester.phylogeny.factories.ParserBasedPhylogenyFactory;
import org.forester.phylogeny.factories.PhylogenyFactory;

// Runs the desktop's RepresentativeTipSelector on trees given as Newick, one per line, over a set of
// scenarios per tree, and extracts the kept tips into a tree exactly as the desktop's "Select
// Representative Tips" handler does (copy, index-map the kept tips, deleteExternalNodesNegativeSelection).
//   java RepContract <trees.nwk>  -> TSV: a "tree" row per tree, then one row per scenario
public class RepContract {

    private static Phylogeny read(final String nwk) throws Exception {
        final PhylogenyFactory factory = ParserBasedPhylogenyFactory.getInstance();
        return factory.create(nwk, new NHXParser())[0];
    }

    private static String sortedNames(final List<PhylogenyNode> nodes) {
        final List<String> n = new ArrayList<>();
        for (final PhylogenyNode x : nodes) {
            n.add(x.getName());
        }
        Collections.sort(n);
        return String.join(",", n);
    }

    private static String length(final PhylogenyNode n) {
        final double d = n.getDistanceToParent();
        return (d == PhylogenyDataUtil.BRANCH_LENGTH_DEFAULT) ? "-" : String.format(Locale.ROOT, "%.9f", d);
    }

    // The tree with its children in order, a name on every node and a branch length on every node but the
    // root: what the prune leaves on the root depends on the order it deletes tips in, which follows node ids,
    // so one selection gives different root lengths in different sessions. Christian, 2026-09-15: the root
    // keeps the original root's own length, in both programs.
    private static String written(final PhylogenyNode n) {
        final StringBuilder sb = new StringBuilder();
        if (!n.isExternal()) {
            sb.append('(');
            for (int i = 0; i < n.getNumberOfDescendants(); ++i) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(written(n.getChildNode(i)));
            }
            sb.append(')');
        }
        sb.append(n.getName() == null ? "" : n.getName());
        if (!n.isRoot()) {
            sb.append(':').append(length(n));
        }
        return sb.toString();
    }

    // MainFrameApplication.selectRepresentativeTips, from "Build the extracted tree" to the prune
    private static String extract(final Phylogeny phy, final SelectionResult result) {
        final Set<Long> keep_ids = result.representativeIds();
        final List<PhylogenyNode> orig_ext = phy.getExternalNodes();
        final Set<Integer> keep_indices = new HashSet<>();
        for (int i = 0; i < orig_ext.size(); ++i) {
            if (keep_ids.contains(orig_ext.get(i).getId())) {
                keep_indices.add(i);
            }
        }
        final Phylogeny copy = phy.copy();
        final List<PhylogenyNode> copy_ext = copy.getExternalNodes();
        final Set<Long> to_delete = new HashSet<>();
        for (int i = 0; i < copy_ext.size(); ++i) {
            if (!keep_indices.contains(i)) {
                to_delete.add(copy_ext.get(i).getId());
            }
        }
        PhylogenyMethods.deleteExternalNodesNegativeSelection(to_delete, copy);
        return written(copy.getRoot());
    }

    private static void row(final int index, final Phylogeny phy, final RepresentativePick pick, final boolean by_cutoff,
                            final double cutoff, final int target, final List<PhylogenyNode> protect) {
        final Set<Long> ids = new HashSet<>();
        for (final PhylogenyNode p : protect) {
            ids.add(p.getId());
        }
        final SelectionResult r = by_cutoff ? RepresentativeTipSelector.selectByCutoff(phy, cutoff, pick, ids)
                : RepresentativeTipSelector.selectByTargetCount(phy, target, pick, ids);
        final List<String> groups = new ArrayList<>();
        for (final RepresentativeTipSelector.Cluster c : r.getClusters()) {
            groups.add(sortedNames(c.getMembers()) + ">" + sortedNames(c.getKeptMembers()));
        }
        Collections.sort(groups);
        // an extraction keeping every tip prunes nothing: "="
        System.out.println(index + "\t" + pick + "\t" + (by_cutoff ? "cutoff=" + cutoff : "target=" + target) + "\t"
                + (protect.isEmpty() ? "-" : sortedNames(protect)) + "\t" + r.getClusterCount() + "\t"
                + r.getKeptCount() + "\t" + r.getProtectedKeptCount() + "\t" + r.getEffectiveCutoff() + "\t"
                + r.usedTopologicalDistance() + "\t" + String.join(" ", groups) + "\t" + r.summary().replace("\n", "|")
                + "\t" + ((r.getKeptCount() == phy.getNumberOfExternalNodes()) ? "=" : extract(phy, r)));
    }

    public static void main(final String[] args) throws Exception {
        int index = 0;
        for (final String line : Files.readAllLines(Paths.get(args[0]))) {
            if (line.isBlank()) {
                continue;
            }
            final Phylogeny phy = read(line);
            System.out.println("tree\t" + index + "\t" + line);
            final int n = phy.getNumberOfExternalNodes();
            final List<PhylogenyNode> ext = phy.getExternalNodes();
            // target 1 reports the whole tree's diameter; the targets in between land on clade diameters
            final double diameter = RepresentativeTipSelector.selectByTargetCount(phy, 1, RepresentativePick.MEDOID)
                    .getEffectiveCutoff();
            final TreeSet<Double> cutoffs = new TreeSet<>();
            cutoffs.add(0.0);
            for (final double f : new double[] { 0.1, 0.25, 0.5, 0.75, 1.0, 1.5 }) {
                cutoffs.add(diameter * f);
            }
            for (final int k : new int[] { 2, Math.max(2, n / 2) }) {
                if (k < n) {
                    final double c = RepresentativeTipSelector.selectByTargetCount(phy, k, RepresentativePick.MEDOID)
                            .getEffectiveCutoff();
                    cutoffs.add(c);
                    if (c > 1e-8) {
                        cutoffs.add(c - 5e-10);   // inside the 1e-9 tolerance: still one group
                        cutoffs.add(c - 5e-9);    // outside it: split
                    }
                }
            }
            final TreeSet<Integer> targets = new TreeSet<>(Arrays.asList(1, 2, 3, Math.max(1, n / 3),
                    Math.max(1, n / 2), Math.max(1, n - 1), n, n + 3));
            final List<PhylogenyNode> none = new ArrayList<>();
            final List<PhylogenyNode> every_third = new ArrayList<>();
            for (int i = 0; i < n; i += 3) {
                every_third.add(ext.get(i));
            }
            final List<PhylogenyNode> last = new ArrayList<>();
            last.add(ext.get(n - 1));
            for (final RepresentativePick pick : RepresentativePick.values()) {
                for (final double c : cutoffs) {
                    row(index, phy, pick, true, c, 0, none);
                }
                for (final int t : targets) {
                    row(index, phy, pick, false, 0.0, t, none);
                }
                row(index, phy, pick, true, diameter * 0.5, 0, every_third);
                row(index, phy, pick, false, 0.0, Math.max(1, n / 3), every_third);
                row(index, phy, pick, true, diameter * 0.25, 0, last);
                row(index, phy, pick, false, 0.0, 1, last);
            }
            ++index;
        }
    }
}
