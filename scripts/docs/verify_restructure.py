#!/usr/bin/env python3
"""Read-only rule B proof and relocation parser; no third-party modules.

RAD-090 compares with its first closure commit using the recorded move map.
"""
import json
import posixpath
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / "docs/archive/reports/2026-11"
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
    import argparse
    parser = argparse.ArgumentParser(description="Rule B proof: preserved prose and equivalent link destinations")
    parser.add_argument('--base', default='origin/main')
    args = parser.parse_args()
    base = git('merge-base', args.base, 'HEAD').decode().strip()
    commits = git('rev-list', '--reverse', f'{base}..HEAD').decode().splitlines()
    closure = commits[0] if commits else base
    moves = json.loads((REPORT_DIR / 'RAD-090_MOVES.json').read_text())
    allowed = WORKFLOW | {'docs/ROADMAP_SESSIONS.md', 'docs/archive/status-archive.md'}
    checked = images = 0
    for old in git('ls-tree', '-r', '--name-only', closure).decode().splitlines():
        new = moves.get(old, old)
        assert (ROOT / new).is_file(), f'Missing file: {old} -> {new}'
        if new in allowed or not old.endswith('.md'):
            if old.startswith(('supabase/', 'docs/review/')) or old == 'scripts/pages/frontend-schema.json':
                assert git('show', f'{closure}:{old}') == (ROOT / new).read_bytes(), new
                images += old.startswith('docs/review/') and old in moves
            continue
        previous = git('show', f'{closure}:{old}').decode()
        current = (ROOT / new).read_text()
        if old in {'docs/RAD-059_PHONE_PACKET.md', 'docs/RAD-062_P05_PHONE_PACKET.md'}:
            assert previous == current, f'Protected bytes: {old}'
        else:
            assert relocate(previous, old, new, moves) == current, f'Not link-target-only/equivalent: {new}'
        checked += 1
    # DECISIONS accepts insertions only: original text and anchor order stay intact.
    previous_decisions = relocate(git('show', f'{closure}:docs/DECISIONS.md').decode(),
                                  'docs/DECISIONS.md', 'docs/DECISIONS.md', moves)
    current_decisions = (ROOT / 'docs/DECISIONS.md').read_text()
    remaining = iter(current_decisions.splitlines())
    for line in previous_decisions.splitlines():
        assert any(candidate == line for candidate in remaining), f'Decision text rewritten/moved: {line[:90]}'
    anchors = re.findall(r'<a id="([^"]+)"', previous_decisions)
    present = re.findall(r'<a id="([^"]+)"', current_decisions)
    assert [anchor for anchor in present if anchor in anchors] == anchors, 'Decision anchors renamed/moved/deleted'
    old_tasks = status(git('show', f'{closure}:docs/project-status.md').decode())['tasks']
    current_tasks = {t['id']: t for t in status((ROOT / 'docs/project-status.md').read_text())['tasks']}
    archive = (ROOT / 'docs/archive/status-archive.md').read_text()
    for task in old_tasks:
        current = current_tasks[task['id']]
        for field in ['id', 'status', 'completion_evidence']:
            assert task.get(field) == current.get(field), f'{task["id"]}: changed {field}'
        if task['status'] == 'done' and task['description'] != current['description']:
            assert f"## {task['id']}\n\n````text\n{task['description']}\n````" in archive, f'{task["id"]}: original description missing'
    print(f'PASS: {checked} Markdown files link-target-only; {images} moved images byte-identical; protected bytes preserved; no deletion')


if __name__ == '__main__':
    main()
