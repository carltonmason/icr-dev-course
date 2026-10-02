# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

Python 3.9.6, managed via a `.venv` virtual environment at the project root. Always use `.venv/bin/python` (not `python` or `python3`) to run scripts.

```bash
# Activate the venv
source .venv/bin/activate

# Install dependencies
pip install pandas numpy
```

Pyright is configured via `pyrightconfig.json` to use `.venv` for type checking.

## Running the examples

The scripts use relative paths, so the working directory matters. `make_data.py` writes to `src/good-habits/tumor_data.csv` and must be run from the project root. The analysis scripts read `tumor_data.csv` from the current directory and must be run from `src/good-habits/`:

```bash
# Generate synthetic data (only needed once) — run from the project root
.venv/bin/python src/good-habits/make_data.py

# Run the analysis scripts — run from src/good-habits/
cd src/good-habits
../../.venv/bin/python bad_analysis.py
../../.venv/bin/python better_names_analysis.py
../../.venv/bin/python good_analysis.py

# Run the tests (no data file needed; works from either directory)
../../.venv/bin/python test_good_analysis.py
```

Both analysis scripts print the same values:
```
Responders: 2/10
Mean growth rate: 56.51 mm^3/day
```

## Architecture

`src/good-habits/` contains a deliberate contrast between two implementations of the same tumor growth analysis:

- **`bad_analysis.py`** — single-script, cryptic names, no functions, no tests. Intentionally bad.
- **`better_names_analysis.py`** — improved variable naming.
- **`good_analysis.py`** — modular functions with type annotations, clear naming, docstrings. The "developer" version.
- **`test_good_analysis.py`** — nine unit tests for `good_analysis.py`, run as a plain script (no pytest dependency).
- **`make_data.py`** — generates `tumor_data.csv` (10 synthetic patients × 4 timepoints). Output is gitignored.

The bad, better, good analysis files are pedagogical triplets — same inputs, same outputs, different code quality.
