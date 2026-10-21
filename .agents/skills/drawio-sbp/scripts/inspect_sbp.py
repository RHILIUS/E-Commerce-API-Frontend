#!/usr/bin/env python3
"""Inspect embedded Draw.io SBP models and check their editable structure."""
import argparse
import base64
import html
import json
import math
from pathlib import Path
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zlib


def decode_models(path):
    """Read each page without assuming compressed versus plain XML storage."""
    svg = ET.parse(path).getroot()
    content = svg.get('content')
    if not content:
        raise ValueError('SVG has no embedded Draw.io content attribute')
    mxfile = ET.fromstring(content)
    if mxfile.tag != 'mxfile':
        raise ValueError('Embedded content is not an mxfile')
    for diagram in mxfile.findall('diagram'):
        model = diagram.find('mxGraphModel')
        if model is None:
            payload = (diagram.text or '').strip()
            if payload.startswith('<mxGraphModel'):
                model = ET.fromstring(payload)
            elif payload:
                raw = zlib.decompress(base64.b64decode(re.sub(r'\s+', '', payload), validate=True), -15)
                model = ET.fromstring(urllib.parse.unquote(raw.decode('utf-8')))
            else:
                raise ValueError('Empty diagram page')
        if model.tag != 'mxGraphModel' or model.find('root') is None:
            raise ValueError('Page is missing mxGraphModel/root')
        yield diagram.get('name', diagram.get('id', 'Unnamed page')), model


def plain(value):
    """Normalize a shape label only for identifying Start and End."""
    return html.unescape(re.sub(r'<[^>]*>', ' ', value or '')).strip().lower()


def inspect(model, complete=False, show_cells=False):
    """Check structural invariants while leaving rendering/business review separate."""
    vertices = list(model.find('root'))
    errors = []
    identifiers = [c.get('id') for c in vertices]
    if None in identifiers or len(identifiers) != len(set(identifiers)):
        errors.append('Missing or duplicate cell IDs')
    cells = {c.get('id'): c for c in vertices if c.get('id') is not None}
    edges = [c for c in vertices if c.get('edge') == '1']
    for c in vertices:
        i = c.get('id')
        if c.get('parent') is not None and c.get('parent') not in cells:
            errors.append(f'{i}: missing parent {c.get("parent")}')
        for attr in ('source', 'target'):
            if c.get('edge') == '1' and c.get(attr) not in cells:
                errors.append(f'{i}: missing {attr} {c.get(attr)}')
        seen = {i}
        parent = c.get('parent')
        while parent in cells:
            if parent in seen:
                errors.append(f'{i}: parent cycle')
                break
            seen.add(parent)
            parent = cells[parent].get('parent')

    def bounds(i):
        c = cells[i]
        g = c.find('mxGeometry')
        if g is None:
            return 0, 0, 0, 0
        x, y = float(g.get('x', 0)), float(g.get('y', 0))
        parent = c.get('parent')
        if parent in cells:
            px, py, _, _ = bounds(parent)
            x += px
            y += py
        return x, y, float(g.get('width', 0)), float(g.get('height', 0))

    if not errors:
        for c in vertices:
            style = c.get('style', '')
            parent = cells.get(c.get('parent'))
            # Phase headers live directly under an environment tableRow.
            if c.get('vertex') == '1' and c.get('value') and parent is not None and 'shape=tableRow' in parent.get('style', ''):
                tokens = style.split(';')
                if 'swimlane' not in tokens and 'shape=swimlane' not in tokens:
                    errors.append(f'{c.get("id")}: titled phase lacks swimlane style')
            if 'annotation_1' not in style:
                continue
            links = [e for e in edges if e.get('target') == c.get('id') and 'endArrow=none' in e.get('style', '')]
            if len(links) != 1:
                errors.append(f'{c.get("id")}: annotation needs one arrowless explanatory link')
                continue
            link = links[0]
            symbol = cells[link.get('source')]
            parent_id = c.get('parent')
            group = cells.get(parent_id)
            if group is None or 'group' not in group.get('style', '').split(';') or symbol.get('parent') != parent_id or link.get('parent') != parent_id:
                errors.append(f'{c.get("id")}: symbol, annotation and link must share a group')
            sx, _, sw, _ = bounds(symbol.get('id'))
            nx, _, _, _ = bounds(c.get('id'))
            if not math.isclose(nx - sx - sw, 20, abs_tol=.1):
                errors.append(f'{c.get("id")}: annotation gap is {nx-sx-sw:g}px, expected 20px')

    if complete:
        terminal = [c for c in vertices if c.get('vertex') == '1' and any(s in c.get('style', '') for s in ['start_1', 'terminator', 'shape=ellipse'])]
        starts = {c.get('id') for c in terminal if plain(c.get('value')) == 'start'}
        ends = {c.get('id') for c in terminal if plain(c.get('value')) == 'end'}
        if not starts or not ends:
            errors.append('Complete flow needs Start and End terminators')
        adjacency = {}
        for e in edges:
            if 'endArrow=none' not in e.get('style', ''):
                adjacency.setdefault(e.get('source'), []).append(e.get('target'))
        seen, pending = set(), list(starts)
        while pending:
            i = pending.pop()
            if i not in seen:
                seen.add(i)
                pending.extend(adjacency.get(i, []))
        if ends and not ends.intersection(seen):
            errors.append('No End terminator is reachable from Start')

    result = {'cell_count': len(vertices), 'edge_count': len(edges), 'errors': errors}
    if show_cells:
        result['cells'] = [{'id': c.get('id'), 'parent': c.get('parent'), 'value': c.get('value', ''), 'style': c.get('style', ''), 'geometry': dict(c.find('mxGeometry').attrib) if c.find('mxGeometry') is not None else None} for c in vertices]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--complete', action='store_true', help='Require reachable Start/End terminators')
    parser.add_argument('--cells', action='store_true', help='Include labels, styles and geometry')
    parser.add_argument('--model-out', type=Path, help='Write decoded XML; requires a single-page file')
    args = parser.parse_args()
    try:
        models = list(decode_models(args.file))
        if not models:
            raise ValueError('No diagram pages found')
        if args.model_out:
            if args.model_out.resolve() == args.file.resolve():
                raise ValueError('--model-out must not overwrite the source SVG')
            if len(models) != 1:
                raise ValueError('--model-out requires a single-page SVG')
            ET.ElementTree(models[0][1]).write(args.model_out, encoding='unicode')
        pages = [{'page': name, **inspect(model, args.complete, args.cells)} for name, model in models]
        print(json.dumps({'file': str(args.file), 'pages': pages}, indent=2))
        return int(any(page['errors'] for page in pages))
    except (ValueError, OSError, ET.ParseError, zlib.error, RecursionError) as error:
        print(f'Inspection failed: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
