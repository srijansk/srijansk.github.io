#!/usr/bin/env python3
"""Centre every post plate on one shared optical frame.

Each plate wraps its drawing in `<g class="ink" transform="translate(...)">`.
This script renders the plate, measures the bounding box of everything that
is not the background, and rewrites that transform so all plates share a
centre. Alignment then survives edits to the drawings, which hand-nudged
coordinates never do.

    ./scripts/align-plates.py           # align, report, and warn on outliers
    ./scripts/align-plates.py --check   # report only; non-zero if misaligned

Requires rsvg-convert (brew install librsvg). Pure stdlib otherwise.
"""
from __future__ import annotations

import re
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLATES = sorted((ROOT / "public/writing").glob("*/plate.svg"))

# The shared frame. Plates are 1200x630; the ink sits centred on this point.
CENTRE_X, CENTRE_Y = 600, 315
BACKGROUND = (250, 250, 247)
TOLERANCE = 2          # px of drift we accept before reporting a plate as off
PROBE = 2              # render at 1/PROBE scale to measure; offsets scale back


def decode_png(path: Path) -> tuple[list[bytearray], int, int, int]:
    """Minimal PNG reader — enough for what rsvg-convert emits."""
    data = path.read_bytes()
    pos, idat = 8, bytearray()
    width = height = channels = 0
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        kind = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, colour = struct.unpack(">IIBB", body[:10])
            if depth != 8:
                raise SystemExit(f"{path}: expected 8-bit PNG, got {depth}")
            channels = {0: 1, 2: 3, 4: 2, 6: 4}[colour]
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + length

    raw = zlib.decompress(bytes(idat))
    stride = width * channels
    rows: list[bytearray] = []
    prev = bytearray(stride)
    i = 0
    for _ in range(height):
        ftype = raw[i]
        i += 1
        line = bytearray(raw[i : i + stride])
        i += stride
        if ftype == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 0xFF
        elif ftype == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 0xFF
        elif ftype == 3:
            for x in range(stride):
                left = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 0xFF
        elif ftype == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                b = prev[x]
                c = prev[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 0xFF
        rows.append(line)
        prev = line
    return rows, width, height, channels


def ink_box(svg: Path) -> tuple[int, int, int, int]:
    """Bounding box of non-background pixels, in plate coordinates."""
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "probe.png"
        subprocess.run(
            ["rsvg-convert", "-w", str(1200 // PROBE), "-h", str(630 // PROBE),
             "-b", "#FAFAF7", "-o", str(png), str(svg)],
            check=True, capture_output=True,
        )
        rows, width, height, channels = decode_png(png)

    br, bg, bb = BACKGROUND
    x0, y0, x1, y1 = width, height, -1, -1
    for y, line in enumerate(rows):
        for x in range(width):
            o = x * channels
            if abs(line[o] - br) + abs(line[o + 1] - bg) + abs(line[o + 2] - bb) > 24:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    if x1 < 0:
        raise SystemExit(f"{svg}: nothing drawn")
    return x0 * PROBE, y0 * PROBE, x1 * PROBE, y1 * PROBE


def main() -> int:
    check_only = "--check" in sys.argv
    if not PLATES:
        print("no plates under public/writing/*/plate.svg", file=sys.stderr)
        return 1

    print(f"{'plate':<44} {'ink':<14} {'centre':<12} {'shift':<12} status")
    print("-" * 92)

    drifted = 0
    for svg in PLATES:
        text = svg.read_text()
        if 'class="ink"' not in text:
            print(f"{svg.parent.name:<44} {'-':<14} {'-':<12} {'-':<12} no g.ink — skipped")
            continue

        # Measure from a clean slate so the shift is absolute, not cumulative.
        neutral = re.sub(r'(<g class="ink" transform=")[^"]*(")', r"\1translate(0,0)\2", text, count=1)
        if neutral != text and not check_only:
            svg.write_text(neutral)
        elif check_only:
            neutral = text

        probe = svg if not check_only else svg
        if check_only:
            x0, y0, x1, y1 = ink_box(probe)
        else:
            x0, y0, x1, y1 = ink_box(probe)

        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = round(CENTRE_X - cx), round(CENTRE_Y - cy)
        off = max(abs(dx), abs(dy))

        if check_only:
            status = "aligned" if off <= TOLERANCE else f"OFF by {off}px"
            if off > TOLERANCE:
                drifted += 1
        else:
            svg.write_text(
                re.sub(r'(<g class="ink" transform=")[^"]*(")',
                       rf"\1translate({dx},{dy})\2", neutral, count=1)
            )
            status = "centred"

        print(f"{svg.parent.name:<44} {f'{x1-x0}x{y1-y0}':<14} "
              f"{f'{cx:.0f},{cy:.0f}':<12} {f'{dx:+d},{dy:+d}':<12} {status}")

    if check_only and drifted:
        print(f"\n{drifted} plate(s) off the shared frame — run without --check", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
