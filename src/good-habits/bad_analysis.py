# The "it works on my machine" version
import pandas as pd
import numpy as np

# load data
df = pd.read_csv("tumor_data.csv")
df2 = df[df['d'] >= 0]
df2['v2'] = (4/3) * 3.14159 * (df2['d']/2)**3

# calc growth
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
