"""Tumor growth analysis for treatment response assessment."""
import math
import sys
import pandas as pd


MM_PER_CM = 10.0
SPHERE_COEFFICIENT = (4 / 3) * math.pi


def calculate_sphere_volume(diameter_mm: float) -> float:
    """Return volume in mm^3 assuming a spherical tumor."""
    radius_mm = diameter_mm / 2
    return SPHERE_COEFFICIENT * radius_mm ** 3


def filter_valid_measurements(measurements: pd.DataFrame) -> pd.DataFrame:
    """Return only measurements with a non-negative diameter."""
    return measurements.loc[measurements['diameter_mm'] >= 0].copy()


def load_measurements(csv_path: str) -> pd.DataFrame:
    """Load measurements from CSV with descriptive column names."""
    measurements = pd.read_csv(csv_path)
    return measurements.rename(
        columns={'p': 'patient_id', 't': 'day', 'd': 'diameter_mm'}
    )


def add_volume_column(measurements: pd.DataFrame) -> pd.DataFrame:
    """Return a copy of measurements with a volume_mm3 column added."""
    with_volume = measurements.copy()
    with_volume['volume_mm3'] = with_volume['diameter_mm'].apply(
        calculate_sphere_volume
    )
    return with_volume


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
    return pd.DataFrame(
        growth_records, columns=['patient_id', 'growth_rate_mm3_per_day']
    )


def is_responder(growth_rate_mm3_per_day: float) -> bool:
    """A patient responds if tumor volume is shrinking over time."""
    return growth_rate_mm3_per_day < 0


def count_responders(growth_rates_mm3_per_day: pd.Series) -> int:
    """Return the number of patients whose tumor volume is shrinking."""
    return int(growth_rates_mm3_per_day.apply(is_responder).sum())


if __name__ == '__main__':
    raw_measurements = load_measurements('tumor_data.csv')
    valid_measurements = filter_valid_measurements(raw_measurements)
    measurements = add_volume_column(valid_measurements)
    cohort_summary = summarize_cohort(measurements)
    if cohort_summary.empty:
        sys.exit("Error: no patients have at least 2 valid measurements, "
                 "so growth rates cannot be computed.")
    responder_count = count_responders(cohort_summary['growth_rate_mm3_per_day'])
    print(f"Responders: {responder_count}/{len(cohort_summary)}")
    print(f"Mean growth rate: {cohort_summary['growth_rate_mm3_per_day'].mean():.2f} mm^3/day")
