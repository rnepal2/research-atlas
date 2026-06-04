#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent


def run(command: list[str]) -> None:
    print("+ " + " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh Research Atlas data end to end.")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--processed-dir", default="data/processed")
    parser.add_argument("--cache-dir", default=".cache/openalex")
    parser.add_argument("--public-artifact", default="frontend/public/data/atlas.json")
    parser.add_argument("--topic")
    parser.add_argument("--max-works", type=int)
    parser.add_argument("--skip-collect", action="store_true")
    parser.add_argument("--topic-artifacts", action="store_true")
    args = parser.parse_args()

    if not args.skip_collect:
        collect = [
            sys.executable,
            str(SCRIPT_DIR / "collect_openalex_data.py"),
            "--config",
            args.config,
            "--output-dir",
            args.raw_dir,
            "--cache-dir",
            args.cache_dir,
        ]
        if args.topic:
            collect.extend(["--topic", args.topic])
        if args.max_works:
            collect.extend(["--max-works", str(args.max_works)])
        run(collect)

    process = [
        sys.executable,
        str(SCRIPT_DIR / "process_openalex_data.py"),
        "--config",
        args.config,
        "--raw-dir",
        args.raw_dir,
        "--output-dir",
        args.processed_dir,
    ]
    if args.topic_artifacts:
        process.append("--topic-artifacts")
    run(process)

    artifact = str(Path(args.processed_dir) / "atlas.json")
    run([sys.executable, str(SCRIPT_DIR / "validate_static_data.py"), "--artifact", artifact])
    run([sys.executable, str(SCRIPT_DIR / "sync_public_data.py"), "--source", artifact, "--target", args.public_artifact])


if __name__ == "__main__":
    main()
