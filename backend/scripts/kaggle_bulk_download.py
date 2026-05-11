from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DatasetSpec:
    slug: str
    domain: str
    label: str


DATASETS: list[DatasetSpec] = [
    # Original 15 verified datasets
    
    # Additional 6 multi-domain datasets (newly validated)
    DatasetSpec("dgomonov/new-york-city-airbnb-open-data", "infrastructure", "NYC Airbnb Open Data"),
    DatasetSpec("stefanoleone992/fifa-21-complete-player-dataset", "social", "FIFA 21 Complete Player Dataset"),
    DatasetSpec("uciml/breast-cancer-wisconsin-data", "disease", "Breast Cancer Wisconsin Dataset"),
    DatasetSpec("fernandol/countries-of-the-world", "geography", "Countries of the World (Detailed)"),
    DatasetSpec("crowdflower/twitter-airline-sentiment", "social", "Twitter Airline Sentiment"),
    DatasetSpec("russellyates88/suicide-rates-overview-1985-to-2016", "disease", "Suicide Rates Overview 1985-2016"),
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def default_raw_root() -> Path:
    return repo_root() / "data" / "kaggle_raw"


def default_kaggle_json() -> Path:
    return repo_root() / "kaggle.json"


def ensure_kaggle_installed() -> None:
    try:
        import kaggle  # noqa: F401
    except ImportError:
        print("[setup] kaggle package not found, installing it now...")
        subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"], check=True)


def find_kaggle_json(explicit: str | None) -> Path:
    candidates = []
    if explicit:
        candidates.append(Path(explicit).expanduser())
    candidates.append(default_kaggle_json())
    candidates.append(Path.home() / ".kaggle" / "kaggle.json")

    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()

    raise FileNotFoundError(
        "kaggle.json not found. Pass --kaggle-json, place it at the repo root, or in %USERPROFILE%\\.kaggle\\kaggle.json."
    )


def ensure_kaggle_config(kaggle_json: Path) -> Path:
    config_dir = Path.home() / ".kaggle"
    config_dir.mkdir(parents=True, exist_ok=True)
    target = config_dir / "kaggle.json"
    if kaggle_json.resolve() != target.resolve():
        shutil.copy2(kaggle_json, target)
    return target


def kaggle_executable() -> str:
    executable = shutil.which("kaggle")
    if executable:
        return executable

    scripts_dir = Path(sys.executable).resolve().parent / "Scripts"
    candidate = scripts_dir / ("kaggle.exe" if sys.platform.startswith("win") else "kaggle")
    if candidate.exists():
        return str(candidate)

    raise FileNotFoundError("Could not find the kaggle CLI executable after installation.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download NexusGraph Kaggle datasets with resumable CLI output.")
    parser.add_argument("--kaggle-json", help="Path to kaggle.json. Defaults to repo root kaggle.json.")
    parser.add_argument("--raw-root", default=str(default_raw_root()), help="Root folder for raw Kaggle downloads.")
    parser.add_argument("--domains", nargs="*", help="Optional subset of domains to download.")
    parser.add_argument("--force", action="store_true", help="Force download even if already marked complete.")
    return parser.parse_args()


def selected_datasets(domains: set[str] | None) -> list[DatasetSpec]:
    if not domains:
        return DATASETS
    selected = [dataset for dataset in DATASETS if dataset.domain in domains]
    if not selected:
        raise ValueError(f"No datasets matched the requested domains: {sorted(domains)}")
    return selected


def build_dataset_dir(raw_root: Path, dataset: DatasetSpec) -> Path:
    return raw_root / dataset.domain / dataset.slug.split("/")[-1]


def run_download(dataset: DatasetSpec, dataset_dir: Path, force: bool = False) -> int:
    dataset_dir.mkdir(parents=True, exist_ok=True)
    complete_marker = dataset_dir / ".complete"
    failed_marker = dataset_dir / ".failed"

    # Check if directory actually has data files (csv, xlsx, sqlite, zip, json)
    has_data = any(dataset_dir.glob("*.csv")) or any(dataset_dir.glob("*.xlsx")) or \
               any(dataset_dir.glob("*.sqlite")) or any(dataset_dir.glob("*.json"))

    if not force and complete_marker.exists() and has_data:
        print(f"[skip] {dataset.domain:<14} {dataset.label} already completed and has data")
        return 0

    if force:
        print(f"[force] {dataset.domain:<14} {dataset.label} (force download requested)")
    elif not has_data and complete_marker.exists():
        print(f"[repair] {dataset.domain:<14} {dataset.label} marked complete but no data found")

    if complete_marker.exists():
        complete_marker.unlink()
    if failed_marker.exists():
        failed_marker.unlink()

    print(f"\n[{dataset.domain}] {dataset.label}")
    print(f"[dataset] {dataset.slug}")

    command = [
        kaggle_executable(),
        "datasets",
        "download",
        "-d",
        dataset.slug,
        "-p",
        str(dataset_dir),
        "--unzip",
    ]

    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
    )

    assert process.stdout is not None
    for line in process.stdout:
        print(line, end="")

    return_code = process.wait()
    if return_code != 0:
        failed_marker.write_text("failed\n", encoding="utf-8")
        print(f"[fail] {dataset.label} could not be downloaded; continuing with the next dataset")
        return 0

    if failed_marker.exists():
        failed_marker.unlink()
    complete_marker.write_text("ok\n", encoding="utf-8")
    print(f"[done] {dataset.label}")
    return 1


def main() -> int:
    args = parse_args()
    ensure_kaggle_installed()

    kaggle_json = find_kaggle_json(args.kaggle_json)
    config_path = ensure_kaggle_config(kaggle_json)
    print(f"[setup] using Kaggle credentials from {config_path}")

    raw_root = Path(args.raw_root).expanduser().resolve()
    raw_root.mkdir(parents=True, exist_ok=True)

    domains = {domain.strip() for domain in args.domains} if args.domains else None
    datasets = selected_datasets(domains)
    print(f"[plan] {len(datasets)} datasets selected")

    completed = 0
    for dataset in datasets:
        dataset_dir = build_dataset_dir(raw_root, dataset)
        completed += run_download(dataset, dataset_dir, force=args.force)

    print(f"\n[finished] downloaded {completed} datasets into {raw_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())