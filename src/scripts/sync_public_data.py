#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    parser = argparse.ArgumentParser(description="Copy processed Atlas data into the frontend public directory.")
    parser.add_argument("--source", default=str(ROOT / "data" / "processed" / "atlas.json"))
    parser.add_argument("--target", default=str(ROOT / "frontend" / "public" / "data" / "atlas.json"))
    args = parser.parse_args()

    source = Path(args.source)
    target = Path(args.target)
    if not source.exists():
        raise SystemExit(f"Missing {source}; run src/scripts/process_openalex_data.py first.")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    print(f"Copied {source} -> {target}")


if __name__ == "__main__":
    main()
