#!/usr/bin/env python3
"""Read-only RAD-089 proof. Run from the repository root; no third-party modules.

Compare the restructure to its first (closure) commit and protect the original
origin/main tree. Inventory tables record the explicit move map and exclusions.
"""
import fnmatch
import json
import posixpath
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

REPORT_DIR = Path(__file__).resolve().parent
ROOT = REPORT_DIR.parents[3]
WORKFLOW = {'AGENTS.md', 'CLAUDE.md', 'docs/README.md', 'docs/DECISIONS.md',
            'docs/HANDOFF.md', 'docs/project-status.md', 'docs/status-format.md'}


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def targets(text):
    """Destination spans only: inline/reference Markdown and HTML href/src.

    Fenced blocks, code spans and HTML comments are masked, never rewritten.
    Balanced parentheses, optional titles and angle destinations are supported.
    """
    mask = list(text)
    fence = None
    offset = 0
    for line in text.splitlines(keepends=True):
        match = re.match(r' {0,3}(`{3,}|~{3,})(.*)', line)
        if match:
            marker = match[1]
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not match[2].strip():
                fence = None
            mask[offset:offset + len(line)] = ' ' * len(line)
        elif fence:
            mask[offset:offset + len(line)] = ' ' * len(line)
        offset += len(line)
    visible = ''.join(mask)
    for pattern in [r'<!--[\s\S]*?-->', r'(`+)([\s\S]*?)\1(?!`)']:
        for match in re.finditer(pattern, visible):
            mask[match.start():match.end()] = ' ' * len(match[0])
        visible = ''.join(mask)
    spans = []
    for match in re.finditer(r'\]\(\s*', visible):
        start = match.end()
        angle = visible[start:start + 1] == '<'
        if angle:
            start += 1
        end, depth = start, 0
        while end < len(visible):
            char = visible[end]
            if char == '\\':
                end += 2
                continue
            if angle and char == '>':
                break
            if not angle:
                if char == '(':
                    depth += 1
                elif char == ')':
                    if not depth:
                        break
                    depth -= 1
                if char.isspace() and not depth:
                    break
            end += 1
        if end > start:
            spans.append((start, end))
    for match in re.finditer(r'(?m)^ {0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))', visible):
        spans.append(match.span(1 if match[1] else 2))
    for match in re.finditer(r'<(?:a|img)\b[^>]*?\b(?:href|src)=["\']([^"\']+)["\']', visible, re.IGNORECASE):
        spans.append(match.span(1))
    return sorted(set(spans))


def strip_targets(text):
    for start, end in reversed(targets(text)):
        text = text[:start] + text[end:]
    return text.encode('utf-8')


def relocate(text, old, new, moves):
    for start, end in reversed(targets(text)):
        value = text[start:end]
        if re.match(r'(?:[a-z][a-z0-9+.-]*:|//|#)', value, re.IGNORECASE):
            continue
        match = re.match(r'([^?#]*)(.*)', value, re.DOTALL)
        pathname, suffix = match.groups()
        if not pathname:
            continue
        decoded = unquote(re.sub(r'\\([() ])', r'\1', pathname))
        absolute = decoded.startswith('/')
        resolved = posixpath.normpath(decoded.lstrip('/') if absolute else
                                     posixpath.join(posixpath.dirname(old), decoded))
        destination = moves.get(resolved, resolved)
        if old == new and destination == resolved:
            continue
        relative = '/' + destination if absolute else posixpath.relpath(destination, posixpath.dirname(new) or '.')
        if relative == decoded:
            continue
        relative = relative.replace(' ', '%20')
        if '\\(' in pathname or '\\)' in pathname:
            relative = relative.replace('(', '\\(').replace(')', '\\)')
        text = text[:start] + relative + suffix + text[end:]
    return text


def status(text):
    return json.loads(re.search(r'```json\n(.*?)\n```', text, re.DOTALL)[1])


def move_map():
    inventory = (REPORT_DIR / 'DOCS_INVENTORY_2026-11-01.md').read_text()
    return dict(re.findall(r'^\| `([^`]+)` \| `([^`]+)` \| MOVE \|$', inventory, re.MULTILINE))


def nonmarkdown_references(base, files):
    docs = [p for p in files if p.startswith('docs/')]
    result = {}
    for source in files:
        if source.lower().endswith('.md'):
            continue
        raw = git('show', f'{base}:{source}')
        if b'\0' in raw:
            continue
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            continue
        # Bare basenames are conservative: include comments and split paths too.
        for doc in docs:
            if doc in text or Path(doc).name in text:
                result.setdefault(doc, []).append(source)
    return result


def main():
    base = git('merge-base', 'origin/main', 'HEAD').decode().strip()
    commits = git('rev-list', '--reverse', f'{base}..HEAD').decode().splitlines()
    assert commits, 'Closure must be the first commit'
    closure = commits[0]
    closure_paths = git('diff-tree', '--no-commit-id', '--name-only', '-r', closure).decode().splitlines()
    assert set(closure_paths) == {'docs/project-status.md', 'docs/DEPS_SECURITY_REPORT_2026-11-01.md'}
    before_files = git('ls-tree', '-r', '--name-only', closure).decode().splitlines()
    moves = move_map()
    assert len(set(moves.values())) == len(moves), 'Destination collision'
    old_tasks = {t['id']: t for t in status(git('show', f'{closure}:docs/project-status.md').decode())['tasks']}
    new_tasks = {t['id']: t for t in status((ROOT / 'docs/project-status.md').read_text())['tasks']}
    assert set(new_tasks) == set(old_tasks) | {'RAD-089'}
    for task_id, old_task in old_tasks.items():
        current = dict(new_tasks[task_id])
        previous = dict(old_task)
        source = previous.pop('source_ref')
        updated = current.pop('source_ref')
        assert previous == current, f'Unrelated task text changed: {task_id}'
        for old, new in moves.items():
            if old.endswith('.md'):
                source = source.replace(old, new)
                source = re.sub(r'(?<![\w/.-])' + re.escape(Path(old).name), new, source)
        assert source == updated, f'Non-path source_ref change: {task_id}'
    references = nonmarkdown_references(closure, before_files)
    assert not set(moves).intersection(references), 'Moved doc read by non-Markdown'
    # Independently reject exact, wildcard and generated-code asset references
    # outside the moved reports. A directory mention in the licence registry is
    # a group-wide provenance reference, even without individual filenames.
    asset_moves = {p: q for p, q in moves.items() if not p.endswith('.md')}
    for source in before_files:
        raw = git('show', f'{closure}:{source}')
        if b'\0' in raw:
            continue
        try:
            source_text = raw.decode()
        except UnicodeDecodeError:
            continue
        patterns = []
        for match in re.finditer(r'(?:docs/review/|\$\{[A-Za-z_]\w*\}/)([A-Za-z0-9_-]+\$\{[^`\n]+?\.(?:jpg|png|json))', source_text):
            patterns.append(re.sub(r'\$\{[^}]+\}', '*', match[1]))
        for asset in asset_moves:
            if source == asset:
                continue
            mentioned = asset in source_text or Path(asset).name in source_text
            mentioned |= any(fnmatch.fnmatch(Path(asset).name, pattern) for pattern in patterns)
            if mentioned:
                assert source in moves and source.endswith('.md'), f'Asset reference outside moved reports: {asset} from {source}'
            if source.endswith('ASSET_PROVENANCE_AND_LICENSES.md'):
                directory = str(Path(asset).parent)
                scoped_directory = directory != 'docs/review' and directory + '/' in source_text
                explicit_glob = re.search(re.escape(directory) + r'/\*', source_text)
                assert not (scoped_directory or explicit_glob), f'Provenance asset moved: {asset}'
    checked, unchanged, no_links, binaries = 0, 0, 0, 0
    for old in before_files:
        new = moves.get(old, old)
        current_path = ROOT / new
        assert current_path.is_file(), f'Deleted: {old}'
        original = git('show', f'{closure}:{old}')
        current = current_path.read_bytes()
        if old.endswith('.md'):
            if old in WORKFLOW:
                continue
            assert strip_targets(original.decode()) == strip_targets(current.decode()), f'Non-target bytes changed: {old}'
            # In addition to stripping, prove every replacement preserves its resolved destination.
            assert relocate(original.decode(), old, new, moves).encode() == current, f'Unexpected destination rewrite: {old}'
            checked += 1
            if original == current:
                unchanged += 1
            if old in moves and not targets(original.decode()):
                assert original == current, f'No-link rename differs: {old}'
                no_links += 1
        else:
            assert original == current, f'Non-Markdown bytes changed: {old}'
            if old in moves:
                binaries += 1
    # Git's actual rename detection must also show exact matches for evidence bytes.
    summary = git('diff', '--summary', '-M', base).decode()
    records = git('diff', '--name-status', '-M', base).decode().splitlines()
    for old, new in moves.items():
        original = git('show', f'{closure}:{old}')
        if not old.endswith('.md') or not targets(original.decode()):
            # --numstat with NUL gives unambiguous old/new names and similarity comes from name-status.
            assert f'R100\t{old}\t{new}' in records, f'Git did not detect R100: {old}'
    print(f'PASS: {checked} Markdown stripped/equivalent destinations; {unchanged} byte-identical; '
          f'{no_links} no-link R100 reports; {binaries} byte-identical R100 assets; no deletions; other task fields unchanged.')
    print('Computed non-Markdown exclusions (snapshot after closure):')
    for doc, sources in sorted(references.items()):
        print(doc + ' <- ' + ', '.join(sources))
    print(f'Git rename summary: {len(summary.splitlines())} entries')


if __name__ == '__main__':
    main()
