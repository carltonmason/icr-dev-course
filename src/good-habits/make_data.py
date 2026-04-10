import pandas as pd
import numpy as np

np.random.seed(42)
rows = []
for pid in range(1, 11):
    baseline = np.random.uniform(15, 30)
    # some patients respond (shrink), some progress (grow)
    trend = np.random.choice([-0.8, 0.5, 1.2])
    for day in [0, 30, 60, 90]:
        diameter = max(0, baseline + trend * day / 10 + np.random.normal(0, 1))
        rows.append({'p': pid, 't': day, 'd': round(diameter, 1)})

pd.DataFrame(rows).to_csv('src/good-habits/tumor_data.csv', index=False)
print("Created tumor_data.csv")
print(pd.read_csv('src/good-habits/tumor_data.csv').head(8))
