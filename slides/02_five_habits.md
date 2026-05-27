## title_slide

# The Five Habits of a Software Developer
## From "it runs" to "it's reliable"

<!-- NOTES
Welcome back from the history section. You've seen 80 years of the industry learning the same lessons over and over. Now let's bring it to your desk. Everything that follows uses a single example — a tumor growth analysis — that we'll improve step by step.
-->

---

## programmer_vs_developer

# Programmer vs. Software Developer

| | Programmer | Software Developer |
|---|---|---|
| Goal | Make it work | Make it work, readable, testable, and maintainable |
| Naming | `df`, `x`, `g` | `tumor_data`, `patient_measurements`, `growth_rate_mm3_per_day` |
| Structure | One long script | Functions, modules, clear separation |
| Testing | "It ran without errors" | Automated tests with known inputs and expected outputs |
| Collaboration | "It works on my machine" | Version control, documentation, reproducibility |

<!-- NOTES
This isn't about job titles — it's about habits. A physicist who writes code with these habits IS a software developer. The table is deliberately provocative. Ask: "Which column sounds more like your code right now?" Most will laugh and point left.
-->

---

## progression_diagram

# The Journey

```diagram
[Write code that runs] → [Name things clearly] → [Split into functions] → [Add tests] → [Use version control] → [Document it]
```

Subtitle: Each habit builds on the last. Today we cover all five.

<!-- NOTES
This is a left-to-right progression. The key point: you don't need to do all five at once. Each one independently improves your code. But they compound — naming makes splitting easier, splitting makes testing easier, and so on. Point out that Git and documentation have their own dedicated sessions later, so today those two get a brief introduction.
-->

---

## count_the_sins

# Count the Sins

```python
import pandas as pd
import numpy as np

df = pd.read_csv("tumor_data.csv")
df2 = df[df['d'] >= 0]
df2['v2'] = (4/3) * 3.14159 * (df2['d']/2)**3

results = []
for pid in df2['p'].unique():
    x = df2[df2['p'] == pid].sort_values('t')
    if len(x) > 1:
        g = (x['v2'].iloc[-1] - x['v2'].iloc[0]) / (x['t'].iloc[-1] - x['t'].iloc[0])
        results.append({'p': pid, 'g': g})

res_df = pd.DataFrame(results)
# responders = growth < 0
r = res_df[res_df['g'] < 0]
print(f"n responders: {len(r)}/{len(res_df)}")
print(f"mean g: {res_df['g'].mean():.2f}")
```

<!-- NOTES
Don't explain the code. Let them read it for 30 seconds, then ask: "Show of hands — who has written code that looks like this?" (pause for laughs). Then ask someone to name a sin they see. Let THEM lead the discussion. The seven sins they should find:

1. df, df2, x, r, g — meaningless variable names
2. 3.14159 — magic number instead of math.pi
3. No units anywhere (d? v2? mm? cm³?)
4. No functions — everything in one flat block
5. No tests
6. v2 implies a v1 that doesn't exist (or got lost)
7. The comment "responders = growth < 0" documents what the next line does — the name is_responder() would have made the comment unnecessary

This is the "before" picture. The rest of the session transforms it step by step.
-->

---

## habit1_title

# Habit 1: Name Things
## If you can't say what it is, you can't find the bug

<!-- NOTES
This is the highest-impact, lowest-effort habit. Renaming variables costs nothing and immediately makes code reviewable. Start with: "What does `g` mean? Growth? Grams? Gravity? A musical note?"
-->

---

## habit1_rules

# Naming Rules

**Variables are nouns:** they describe what a thing IS
- `diameter_mm`, `volume_mm3`, `growth_rate_mm3_per_day`

**Functions are verbs:** they describe what an action DOES
- `calculate_sphere_volume()`, `compute_growth_rate()`, `is_responder()`

**Constants are UPPER_SNAKE_CASE:**
- `RESPONSE_THRESHOLD_MM3_PER_DAY = 0.0`

**Embed units in the name:**
- Not `diameter` → `diameter_mm`
- Not `volume` → `volume_mm3`
- Not `rate` → `growth_rate_mm3_per_day`

<!-- NOTES
Walk through each rule with the tumor example. The units rule is especially important for physics code — a Mars Climate Orbiter crashed because of a unit mismatch. Ask: "Has anyone ever had a bug that turned out to be a unit confusion?" Guaranteed someone has.

The function naming rule is powerful: if you can't name the function with a clear verb, you probably don't understand what it does yet. That's a design signal, not just a style issue.
-->

---

## habit1_before_after

# Naming: Before and After

**Before:**
```python
df2['v2'] = (4/3) * 3.14159 * (df2['d']/2)**3
g = (x['v2'].iloc[-1] - x['v2'].iloc[0]) / (x['t'].iloc[-1] - x['t'].iloc[0])
```

**After:**
```python
import math
diameter_mm = measurements['diameter_mm']
volume_mm3 = (4/3) * math.pi * (diameter_mm / 2) ** 3

growth_rate_mm3_per_day = (
    (volumes.iloc[-1] - volumes.iloc[0])
    / (days.iloc[-1] - days.iloc[0])
)
```

Same calculation. One you can read six months later.

<!-- NOTES
Put both on screen side by side if possible. Ask: "Which one would you rather debug at 11 PM before a conference deadline?" The before version requires you to hold a mental translation table (d = diameter, v2 = volume, t = time, g = growth). The after version IS the translation table. Note: math.pi vs 3.14159 — not just cleaner, but more precise (15 decimal digits vs 5).
-->

---

## habit2_title

# Habit 2: Split the File
## One function, one job

<!-- NOTES
Transition line: "Now that we can read the names, notice the code is still one giant block. What if you need the volume calculation in a different analysis? Copy-paste it? That's how bugs breed."
-->

---

## habit2_why

# Why Split?

**Reuse:** Need `calculate_sphere_volume()` in another analysis? Import it.

**Testing:** You can't test a 50-line script easily. You CAN test a 5-line function.

**Debugging:** Error in growth rate? You know exactly where to look.

**Collaboration:** Two people can work on different functions without conflicts.

<!-- NOTES
The reuse argument lands well with this audience — they often have multiple analysis scripts that share calculations. Ask: "How many of you have copy-pasted a function between scripts?" Then: "What happens when you find a bug in the original — do you remember everywhere you pasted it?"
-->

---

## habit2_structure

# Split: The Structure

```
tumor_analysis/
├── analysis.py          # Main script — orchestrates
├── calculations.py      # Pure functions — math
├── data_loading.py      # I/O — reads CSV, validates
└── test_calculations.py # Tests — proves it works
```

Each file has ONE responsibility. `calculations.py` does math. It doesn't read files. It doesn't print results. It calculates.

<!-- NOTES
This is a simplified version of the "separation of concerns" principle from Parnas (1972) — callback to the timeline. The key insight: calculations.py has NO side effects. Given the same input, it always returns the same output. That's what makes it testable.

For this audience, the immediate win is: calculations.py can be imported into Jupyter notebooks, other scripts, pipelines. The analysis script is just one consumer of those functions.
-->

---

## habit2_function_example

# Split: A Function Emerges

```python
def calculate_sphere_volume(diameter_mm: float) -> float:
    """Calculate sphere volume from diameter."""
    radius_mm = diameter_mm / 2
    return (4 / 3) * math.pi * radius_mm ** 3
```

**Type hints** tell you what goes in and what comes out.

**Docstring** tells you what it does in one line.

**Pure function** — no side effects, no global state, same input → same output.

<!-- NOTES
Walk through the anatomy: type hints on the signature (float in, float out), a one-line docstring, and a clear calculation. Point out this is testable in isolation — you don't need a CSV file or a DataFrame to verify the volume formula. You just call calculate_sphere_volume(20) and check the answer.

The phrase "pure function" is worth introducing — it means no side effects. It doesn't read files, doesn't modify global variables, doesn't print anything. Given the same diameter, it always returns the same volume. This is the gold standard for testable code.
-->

---

## habit3_title

# Habit 3: Write Tests
## Trust, but verify — automatically

<!-- NOTES
Transition: "You've got named variables and clean functions. How do you know they're correct? You test them — not by eyeballing the output, but by writing code that checks the code."
-->

---

## habit3_why

# Why Test?

You already test — you just do it badly.

**What you do now:** Run the script. Look at the output. Think "that looks about right."

**What could go wrong:**
- "Looks right" ≠ IS right
- You can't remember what "right" looked like last month
- You change one thing and silently break another

**What testing gives you:** A machine that checks your work, every time, in seconds.

<!-- NOTES
The "you already test" framing is important — it meets them where they are rather than introducing testing as a foreign concept. They DO check their output. The habit is to automate that checking so it happens reliably. Mention: most irreproducible results in scientific computing aren't fraud — they're undetected bugs. Testing is a reproducibility tool.
-->

---

## habit3_example

# A Test Is Just an Assert

```python
def test_sphere_volume_known_value():
    # 20mm diameter → 10mm radius → (4/3) × π × 10³
    expected = (4 / 3) * math.pi * 1000
    actual = calculate_sphere_volume(20)
    assert math.isclose(actual, expected)

def test_sphere_volume_zero():
    assert calculate_sphere_volume(0) == 0
```

That's it. Known input. Expected output. Assert they match.

<!-- NOTES
Demystify testing. A test is: call the function with a known input, check the output matches what you calculated by hand. The math.isclose is important for floating-point comparison — never use == with floats.

The zero test is a boundary case. What happens at the edges? Good tests check normal cases AND edge cases. Ask: "What would you test for negative diameters?" — that's a design question the test forces you to answer.
-->

---

## habit3_real_test

# Testing Behavior, Not Just Math

```python
def test_shrinking_tumor_is_responder():
    measurements = pd.DataFrame({
        'day': [0, 90],
        'volume_mm3': [1000.0, 400.0],
    })
    rate = compute_growth_rate(measurements)
    assert rate < 0
    assert is_responder(rate)

def test_growing_tumor_is_not_responder():
    measurements = pd.DataFrame({
        'day': [0, 90],
        'volume_mm3': [500.0, 1500.0],
    })
    rate = compute_growth_rate(measurements)
    assert rate > 0
    assert not is_responder(rate)
```

<!-- NOTES
Now we're testing scientific logic, not just formulas. A tumor that shrinks should be classified as a responder. A tumor that grows should not. These tests encode your scientific understanding — if someone changes the responder threshold or the growth rate formula, these tests catch it immediately.

Point out: the test creates its OWN data. It doesn't depend on a CSV file existing. That's intentional — tests should be self-contained and reproducible anywhere.
-->

---

## habit3_running_tests

# Running Tests

```bash
$ python -m pytest test_good_analysis.py -v

test_good_analysis.py::test_sphere_volume_known_value PASSED
test_good_analysis.py::test_sphere_volume_zero PASSED
test_good_analysis.py::test_shrinking_tumor_is_responder PASSED
test_good_analysis.py::test_growing_tumor_is_not_responder PASSED

========= 4 passed in 0.3s =========
```

Four tests. 0.3 seconds. Run them every time you change anything.

<!-- NOTES
Show this as a terminal screenshot if possible. The green "PASSED" is satisfying — it's immediate feedback. Mention pytest discovers tests automatically by naming convention (files starting with test_, functions starting with test_). No configuration needed. They can run this TODAY with `pip install pytest`.
-->

---

## habit4_title

# Habit 4: Use Git
## A time machine for your code

<!-- NOTES
Brief section — 4 minutes max. The goal is motivation, not tutorial. The Git session covers the mechanics later. Your line: "We've been improving this code step by step. What if you need to go back? What if a collaborator makes a change that breaks something? What if you need to prove exactly which code produced a published result?"
-->

---

## habit4_key_points

# Git in 60 Seconds

**What it does:** Records every version of every file. You can always go back.

**Why it matters for research:**
- Reproducibility — tag the exact code that produced a figure
- Collaboration — merge changes from multiple people without overwriting
- Safety net — broke something? Revert to yesterday

**The dedicated Git session will cover the mechanics.**

For now: if `data_final_v3_REAL.py` is in your workflow, Git replaces it.

<!-- NOTES
The data_final_v3_REAL.py joke should land — everyone has done this. Git eliminates the need for filename-based versioning entirely. Mention: "Every version of every file, with a message explaining what changed and why. No more v2, v3, FINAL, REAL_FINAL."

Don't go deeper — just plant the seed and point them to the Git session.
-->

---

## habit5_title

# Habit 5: Document It
## The README is for you, six months from now

<!-- NOTES
Also brief — 4 minutes. Documentation has its own session. Your line: "You think you'll remember what this code does. You won't. The person most likely to be confused by your code is future you."
-->

---

## habit5_key_points

# Documentation: The Minimum

**Docstrings** — one line per function:
```python
def calculate_sphere_volume(diameter_mm: float) -> float:
    """Calculate sphere volume from diameter."""
```

**README.md** — one file per project:
- What does this project do?
- How do I run it?
- What data does it need?

**The dedicated documentation session will cover the details.**

For now: if a function doesn't have a docstring, add one. If your project doesn't have a README, write one.

<!-- NOTES
Keep it practical and low-bar. One-line docstrings and a basic README are the floor, not the ceiling. The documentation session will cover more sophisticated approaches.

The type hints we added earlier (float → float) are themselves a form of documentation — they tell the reader what the function expects and returns without reading the body. That's "self-documenting code" in practice.
-->

---

## recap

# The Five Habits — Recap

1. **Name things** — nouns for variables, verbs for functions, units in names
2. **Split the file** — one function, one job, importable modules
3. **Write tests** — known input, expected output, assert they match
4. **Use Git** — every version recorded, always reversible *(dedicated session)*
5. **Document it** — docstrings + README as the floor *(dedicated session)*

Each one independently improves your code. Together they compound.

<!-- NOTES
Quick recap — no more than 60 seconds. Then: "You have the bad version and the good version in your download pack. Try the exercises in the README. The most valuable exercise: take YOUR code — the script you're working on right now — and apply Habit 1. Just rename the variables. See how it feels."

The download pack includes: bad_analysis.py, good_analysis.py, test_good_analysis.py, make_data.py, tumor_data.csv, and README.md.
-->

---

## closing

# The Code You Write Today Is the Code You Debug Tomorrow

Start with one habit. Then add another.

Download pack: `bad_analysis.py`, `good_analysis.py`, `test_good_analysis.py`, `make_data.py`, `tumor_data.csv`, `README.md`

<!-- NOTES
Final slide — leave this up during questions. The closing line is the takeaway: you don't need to adopt all five habits at once. Start with naming. Then try splitting a function out. Then write one test. The compound effect kicks in quickly.
-->
