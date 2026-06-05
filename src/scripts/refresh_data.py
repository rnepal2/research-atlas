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
    try:
        subprocess.run(command, cwd=ROOT, check=True)
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.returncode) from None


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh Research Atlas data end to end.")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--processed-dir", default="data/processed")
    parser.add_argument("--cache-dir", default=".cache/openalex")
    parser.add_argument("--public-artifact", default="frontend/public/data/atlas.json")
    parser.add_argument("--public-dir", default="frontend/public")
    parser.add_argument("--topic")
    parser.add_argument("--max-works", type=int)
    parser.add_argument("--missing-only", action="store_true", help="Collect only configured topics with no raw works.")
    parser.add_argument("--stale-below", type=int, help="Collect only topics with fewer than this many raw works.")
    parser.add_argument("--sort-by-raw-depth", action="store_true", help="Collect shallower raw topic files first.")
    parser.add_argument("--limit-topics", type=int, help="Limit the number of matching topics collected in this run.")
    parser.add_argument("--allow-unauthenticated-openalex", action="store_true", help="Allow unauthenticated OpenAlex collection for small development probes.")
    parser.add_argument("--min-interval", type=float, help="Minimum seconds between OpenAlex requests.")
    parser.add_argument("--max-attempts", type=int, help="Maximum attempts for each OpenAlex request.")
    parser.add_argument("--max-retry-wait", type=int, help="Maximum seconds to wait between OpenAlex retries.")
    parser.add_argument("--fast", action="store_true", help="Use cached/raw data only; equivalent to --skip-collect.")
    parser.add_argument("--skip-collect", action="store_true")
    parser.add_argument("--include-metadata", action="store_true", help="Also refresh OpenAlex topic metadata discovery files.")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--max-artifact-mb", type=float, default=24.0)
    parser.add_argument("--max-index-mb", type=float, default=3.0)
    parser.add_argument("--max-topic-file-mb", type=float, default=0.5)
    parser.add_argument("--topic-artifacts", action="store_true")
    args = parser.parse_args()

    artifact = str(Path(args.processed_dir) / "atlas.json")

    if args.validate_only:
        run(
            [
                sys.executable,
                str(SCRIPT_DIR / "validate_static_data.py"),
                "--artifact",
                artifact,
                "--max-artifact-mb",
                str(args.max_artifact_mb),
                "--max-index-mb",
                str(args.max_index_mb),
                "--max-topic-file-mb",
                str(args.max_topic_file_mb),
            ]
        )
        return

    if args.fast:
        args.skip_collect = True

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
        if args.missing_only:
            collect.append("--missing-only")
        if args.stale_below is not None:
            collect.extend(["--stale-below", str(args.stale_below)])
        if args.sort_by_raw_depth:
            collect.append("--sort-by-raw-depth")
        if args.limit_topics is not None:
            collect.extend(["--limit-topics", str(args.limit_topics)])
        if args.allow_unauthenticated_openalex:
            collect.append("--allow-unauthenticated")
        if args.min_interval is not None:
            collect.extend(["--min-interval", str(args.min_interval)])
        if args.max_attempts is not None:
            collect.extend(["--max-attempts", str(args.max_attempts)])
        if args.max_retry_wait is not None:
            collect.extend(["--max-retry-wait", str(args.max_retry_wait)])
        if not args.include_metadata:
            collect.append("--skip-metadata")
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
        "--skip-empty",
    ]
    if args.topic_artifacts:
        process.append("--topic-artifacts")
    run(process)

    run(
        [
            sys.executable,
            str(SCRIPT_DIR / "validate_static_data.py"),
            "--artifact",
            artifact,
            "--max-artifact-mb",
            str(args.max_artifact_mb),
            "--max-index-mb",
            str(args.max_index_mb),
            "--max-topic-file-mb",
            str(args.max_topic_file_mb),
        ]
    )
    run([sys.executable, str(SCRIPT_DIR / "sync_public_data.py"), "--source", artifact, "--target", args.public_artifact])
    run([sys.executable, str(SCRIPT_DIR / "generate_static_assets.py"), "--artifact", artifact, "--public-dir", args.public_dir])
    run([sys.executable, str(SCRIPT_DIR / "measure_progress.py"), "--artifact", artifact])


if __name__ == "__main__":
    main()
