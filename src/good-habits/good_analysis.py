"""Tumor growth analysis for treatment response assessment."""
import math
import pandas as pd


MM_PER_CM = 10.0
SPHERE_COEFFICIENT = (4 / 3) * math.pi


def calculate_sphere_volume(diameter_mm: float) -> float:
    """Return volume in mm^3 assuming a spherical tumor."""
    radius_mm = diameter_mm / 2
    return SPHERE_COEFFICIENT * radius_mm ** 3


def load_measurements(csv_path: str) -> pd.DataFrame:
    """Load measurements and drop invalid rows."""
    measurements = pd.read_csv(csv_path)
    measurements = measurements.rename(
        columns={'p': 'patient_id', 't': 'day', 'd': 'diameter_mm'}
    )
    valid_measurements = measurements[measurements['diameter_mm'] >= 0].copy()
    valid_measurements['volume_mm3'] = valid_measurements['diameter_mm'].apply(
        calculate_sphere_volume
    )
    return valid_measurements


def compute_growth_rate(patient_measurements: pd.DataFrame) -> float:
    """Return volume change per day for one patient (mm^3/day)."""
    sorted_measurements = patient_measurements.sort_values('day')
    volume_change = (
        sorted_measurements['volume_mm3'].iloc[-1]
        - sorted_measurements['volume_mm3'].iloc[0]
    )
    time_change_days = (
        sorted_measurements['day'].iloc[-1]
        - sorted_measurements['day'].iloc[0]
    )
    return volume_change / time_change_days


def summarize_cohort(measurements: pd.DataFrame) -> pd.DataFrame:
    """Compute growth rate per patient across the cohort."""
    growth_records = []
    for patient_id, patient_data in measurements.groupby('patient_id'):
        if len(patient_data) < 2:
            continue
        growth_records.append({
            'patient_id': patient_id,
            'growth_rate_mm3_per_day': compute_growth_rate(patient_data),
        })
    return pd.DataFrame(growth_records)


def is_responder(growth_rate_mm3_per_day: float) -> bool:
    """A patient responds if tumor volume is shrinking over time."""
    return growth_rate_mm3_per_day < 0


if __name__ == '__main__':
    measurements = load_measurements('tumor_data.csv')
    cohort_summary = summarize_cohort(measurements)
    responder_count = cohort_summary['growth_rate_mm3_per_day'].apply(is_responder).sum()
    print(f"Responders: {responder_count}/{len(cohort_summary)}")
    print(f"Mean growth rate: {cohort_summary['growth_rate_mm3_per_day'].mean():.2f} mm^3/day")
