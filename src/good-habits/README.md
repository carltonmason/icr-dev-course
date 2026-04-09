# The Five Habits — Code Examples

Companion code for the "Five Habits of a Software Developer" section.

A tumor growth analysis in two versions: the "programmer" version that works
but commits every sin we discussed, and the "developer" version that does the
same job with naming, modularity, and tests.

## Files

| File | What it is |
|---|---|
| `make_data.py` | Generates `tumor_data.csv` (10 synthetic patients, 4 timepoints each). Run this first. |
| `tumor_data.csv` | Synthetic tumor diameter measurements. Pre-generated so you can skip `make_data.py` if you want. |
| `bad_analysis.py` | The "programmer" version. Runs. Produces correct numbers. Commits every sin. |
| `good_analysis.py` | The "developer" version. Same inputs, same outputs, completely different artifact. |
| `test_good_analysis.py` | Tests for the developer version. Four tests, all passing. |

## Running the examples

All files use only `pandas` and the standard library. No install beyond pandas.

```bash
# Generate the data (only needed once)
python make_data.py

# Run the bad version
python bad_analysis.py

# Run the good version
python good_analysis.py

# Run the tests
python test_good_analysis.py
```

Both analysis scripts produce the same output:

```
Responders: 2/10
Mean growth rate: 56.51 mm^3/day
```

That's the whole point. Same numbers, completely different code.

## Exercise suggestions

Once you've read through both versions, try one of these:

1. **Add a bug to `good_analysis.py`** — change the sphere volume formula to use
   `diameter ** 3` instead of `radius ** 3`. Run the tests. Watch them fail and
   tell you exactly what broke. This is the safety net in action.

2. **Extend the good version** — add a function `classify_response()` that returns
   `"responder"`, `"stable"`, or `"progressor"` based on growth rate thresholds.
   Write a test for each case before you write the function. This is TDD.

3. **Refactor the bad version yourself** — don't peek at `good_analysis.py`. See
   how far you get. Then compare. The differences are the habits.
