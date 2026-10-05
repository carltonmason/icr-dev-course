# CLAUDE.md

## Environment

Python 3.9 in `.venv` at the project root. Always run Python as `.venv/bin/python` (or `../../.venv/bin/python` from `src/good-habits/`). Dependencies are in `requirements.txt`.

## Running

Paths are relative, so the working directory matters:

- `make_data.py` — run from the project root (writes `src/good-habits/tumor_data.csv`).
- Analysis scripts — run from `src/good-habits/`.
- `test_good_analysis.py` — works from any directory (it writes its own temporary CSV).
- Tests are a plain script (`test_good_analysis.py`), not pytest. Don't add a pytest dependency.

## Pedagogical constraints (src/good-habits/)

`bad_analysis.py` → `better_names_analysis.py` → `good_analysis.py` show the same analysis at increasing code quality.

- The bad and better versions are intentionally flawed. Don't refactor, lint-fix or "improve" them unless asked.
- All three must produce the same numbers: 2/10 responders, mean growth rate 56.51 mm^3/day (labels differ in `bad_analysis.py`).
