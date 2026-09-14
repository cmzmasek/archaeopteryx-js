import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.forester.io.parsers.nhx.NHXParser;
import org.forester.io.writers.PhylogenyWriter;
import org.forester.phylogeny.Phylogeny;
import org.forester.phylogeny.PhylogenyMethods;
import org.forester.phylogeny.PhylogenyNode;
import org.forester.phylogeny.PhylogenyNode.NH_CONVERSION_SUPPORT_VALUE_STYLE;
import org.forester.phylogeny.data.Confidence;
import org.forester.phylogeny.factories.ParserBasedPhylogenyFactory;
import org.forester.phylogeny.factories.PhylogenyFactory;
import org.forester.phylogeny.iterators.PhylogenyNodeIterator;

// Runs the desktop's PhylogenyMethods.madRoot on trees given as Newick, one per line.
//   java MadContract contract <trees.nwk>  -> TSV: index, newick, root children, per-branch MAD
//   java MadContract writers               -> how a MAD-rooted tree is written out
public class MadContract {

    private static Phylogeny read(final String nwk) throws Exception {
        final PhylogenyFactory factory = ParserBasedPhylogenyFactory.getInstance();
        final NHXParser parser = new NHXParser();
        return factory.create(nwk, parser)[0];
    }

    private static String names(final PhylogenyNode node) {
        final List<String> n = new ArrayList<>();
        for (final PhylogenyNode ext : node.getAllExternalDescendants()) {
            n.add(ext.getName());
        }
        Collections.sort(n);
        return String.join(",", n);
    }

    // the tips on the side of the branch above `node` NOT holding the alphabetically first tip
    private static String sideKey(final Phylogeny phy, final PhylogenyNode node) {
        final List<String> all = new ArrayList<>();
        for (final PhylogenyNode t : phy.getExternalNodes()) {
            all.add(t.getName());
        }
        Collections.sort(all);
        final List<String> under = new ArrayList<>();
        for (final PhylogenyNode ext : node.getAllExternalDescendants()) {
            under.add(ext.getName());
        }
        final List<String> side;
        if (under.contains(all.get(0))) {
            side = new ArrayList<>(all);
            side.removeAll(under);
        }
        else {
            side = under;
        }
        Collections.sort(side);
        return String.join(",", side);
    }

    public static void main(final String[] args) throws Exception {
        if (args[0].equals("contract")) {
            int index = 0;
            for (final String line : Files.readAllLines(Paths.get(args[1]))) {
                if (line.isBlank()) {
                    continue;
                }
                final Phylogeny phy = read(line);
                PhylogenyMethods.madRoot(phy);
                final List<String> root = new ArrayList<>();
                for (final PhylogenyNode c : phy.getRoot().getDescendants()) {
                    root.add(names(c) + "=" + c.getDistanceToParent());
                }
                Collections.sort(root);
                final List<String> mads = new ArrayList<>();
                for (final PhylogenyNodeIterator it = phy.iteratorPostorder(); it.hasNext(); ) {
                    final PhylogenyNode nd = it.next();
                    for (final Confidence c : nd.getBranchData().getConfidences()) {
                        if (PhylogenyMethods.MAD_CONFIDENCE_TYPE.equals(c.getType())) {
                            mads.add(sideKey(phy, nd) + "=" + c.getValue());
                        }
                    }
                }
                Collections.sort(mads);
                System.out.println(index++ + "\t" + line + "\t" + String.join(" ", root) + "\t" + String.join(" ", mads));
            }
        }
        else {
            final PhylogenyWriter w = new PhylogenyWriter();
            for (final String nwk : new String[] { "((A:1,B:2):1,(C:3,D:4):1)",
                    "((A:1,B:2)x:1[&&NHX:B=80],(C:3,D:4)y:1[&&NHX:B=90])" }) {
                System.out.println("=== input " + nwk);
                final Phylogeny phy = read(nwk);
                PhylogenyMethods.madRoot(phy);
                System.out.println("--- NH in square brackets\n" + w.toNewHampshire(phy, true, NH_CONVERSION_SUPPORT_VALUE_STYLE.IN_SQUARE_BRACKETS));
                System.out.println("--- NH as internal node names\n" + w.toNewHampshire(phy, true, NH_CONVERSION_SUPPORT_VALUE_STYLE.AS_INTERNAL_NODE_NAMES));
                System.out.println("--- NH none\n" + w.toNewHampshire(phy, true, NH_CONVERSION_SUPPORT_VALUE_STYLE.NONE));
                System.out.println("--- NHX\n" + w.toNewHampshireX(phy));
                System.out.println("--- Nexus (square brackets)\n" + w.toNexus(phy, NH_CONVERSION_SUPPORT_VALUE_STYLE.IN_SQUARE_BRACKETS));
                System.out.println("--- phyloXML\n" + w.toPhyloXML(phy, 0));
            }
        }
    }
}
