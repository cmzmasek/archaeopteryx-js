#!/usr/bin/env python3
"""Apply one sabotage mutation, or fail loudly.

A mutant is a fixture, and it goes stale when the code under it moves. A
pattern that no longer matches produces a file identical to the baseline, the
harness passes, and the tally reads SURVIVED -- which is indistinguishable
from a guard that failed to catch a real change. The desktop found four of
their label mutants had gone silently invalid this way; the same trap is
available here every time a sabotage run uses a bare string replace.

So: the old text must appear EXACTLY ONCE. Not zero times (stale), not twice
(ambiguous -- replacing the first is a different mutation from replacing the
second, and which one you got is invisible).

  python3 test_trees/mutate.py <file> <old-file> <new-file>   apply
  python3 test_trees/mutate.py --restore <file> <backup>      put it back
"""
import sys


def die(msg):
    sys.stderr.write('MUTATION INVALID: ' + msg + '\n')
    sys.exit(2)


def main(argv):
    if len(argv) == 4 and argv[1] == '--restore':
        open(argv[2], 'w').write(open(argv[3]).read())
        print('restored ' + argv[2])
        return 0
    if len(argv) != 4:
        die('usage: mutate.py <file> <old-file> <new-file>')
    path, oldf, newf = argv[1], argv[2], argv[3]
    src = open(path).read()
    old = open(oldf).read()
    new = open(newf).read()
    # a trailing newline in the pattern file is an artefact of writing it
    if old.endswith('\n') and not src.count(old):
        old = old[:-1]
    if new.endswith('\n'):
        new = new[:-1]
    hits = src.count(old)
    if hits == 0:
        die('the pattern matched 0 times in ' + path
            + ' -- the code moved under this mutant, so it tests nothing')
    if hits > 1:
        die('the pattern matched ' + str(hits) + ' times in ' + path
            + ' -- ambiguous, so which mutation ran would be invisible')
    open(path, 'w').write(src.replace(old, new, 1))
    print('mutation applied (1 site)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
