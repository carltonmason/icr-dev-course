# Step 1: proper naming — same structure, better names
import math
import pandas as pd

# load data
SPHERE_COEFFICIENT = (4 / 3) * math.pi
measurements = pd.read_csv("tumor_data.csv")
valid_measurements = measurements[measurements['d'] >= 0].copy()
valid_measurements['volume_mm3'] = SPHERE_COEFFICIENT * (valid_measurements['d'] / 2) ** 3

# calculate growth rates
growth_records = []
for patient_id in valid_measurements['p'].unique():
    patient_measurements = valid_measurements[valid_measurements['p'] == patient_id].sort_values('t')
    if len(patient_measurements) > 1:
        growth_rate_mm3_per_day = (patient_measurements['volume_mm3'].iloc[-1] - patient_measurements['volume_mm3'].iloc[0]) / (patient_measurements['t'].iloc[-1] - patient_measurements['t'].iloc[0])
        growth_records.append({'p': patient_id, 'growth_rate_mm3_per_day': growth_rate_mm3_per_day})

cohort_summary = pd.DataFrame(growth_records)
# responders have negative growth (tumor is shrinking)
responders = cohort_summary[cohort_summary['growth_rate_mm3_per_day'] < 0]
print(f"Responders: {len(responders)}/{len(cohort_summary)}")
print(f"Mean growth rate: {cohort_summary['growth_rate_mm3_per_day'].mean():.2f} mm^3/day")
