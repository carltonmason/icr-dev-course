"""Tests for tumor growth analysis."""
import math
import os
import tempfile
import pandas as pd
from good_analysis import (
    add_volume_column,
    calculate_sphere_volume,
    compute_growth_rate,
    count_responders,
    filter_valid_measurements,
    is_responder,
    load_measurements,
    summarize_cohort,
)


def test_sphere_volume_known_value():
    # 20mm diameter -> 10mm radius -> (4/3)*pi*1000
    assert math.isclose(calculate_sphere_volume(20), (4 / 3) * math.pi * 1000)


def test_sphere_volume_zero():
    assert calculate_sphere_volume(0) == 0


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


def test_filter_drops_negative_diameters_and_keeps_zero():
    measurements = pd.DataFrame({
        'diameter_mm': [-1.0, 0.0, 12.5],
    })
    valid_measurements = filter_valid_measurements(measurements)
    assert list(valid_measurements['diameter_mm']) == [0.0, 12.5]


def test_load_measurements_renames_columns():
    with tempfile.TemporaryDirectory() as temp_dir:
        csv_path = os.path.join(temp_dir, 'measurements.csv')
        pd.DataFrame({'p': [1], 't': [30], 'd': [12.5]}).to_csv(csv_path, index=False)
        measurements = load_measurements(csv_path)
    assert list(measurements.columns) == ['patient_id', 'day', 'diameter_mm']
    assert measurements.iloc[0].tolist() == [1, 30, 12.5]


def test_add_volume_column_computes_sphere_volume():
    measurements = pd.DataFrame({'diameter_mm': [0.0, 20.0]})
    with_volume = add_volume_column(measurements)
    assert with_volume['volume_mm3'].iloc[0] == 0
    assert math.isclose(with_volume['volume_mm3'].iloc[1], (4 / 3) * math.pi * 1000)
    assert 'volume_mm3' not in measurements.columns


def test_count_responders_counts_only_shrinking_tumors():
    growth_rates = pd.Series([-5.0, 0.0, 12.0, -0.1])
    assert count_responders(growth_rates) == 2


def test_count_responders_returns_plain_int():
    growth_rates = pd.Series([-1.0])
    assert type(count_responders(growth_rates)) is int


def test_count_responders_empty_cohort_is_zero():
    assert count_responders(pd.Series([], dtype=float)) == 0


def test_summarize_cohort_with_no_eligible_patients_keeps_columns():
    # A single measurement per patient is too few to compute a growth rate
    measurements = pd.DataFrame({
        'patient_id': [1],
        'day': [0],
        'volume_mm3': [500.0],
    })
    cohort_summary = summarize_cohort(measurements)
    assert len(cohort_summary) == 0
    assert count_responders(cohort_summary['growth_rate_mm3_per_day']) == 0


if __name__ == '__main__':
    test_sphere_volume_known_value()
    test_sphere_volume_zero()
    test_shrinking_tumor_is_responder()
    test_growing_tumor_is_not_responder()
    test_filter_drops_negative_diameters_and_keeps_zero()
    test_load_measurements_renames_columns()
    test_add_volume_column_computes_sphere_volume()
    test_count_responders_counts_only_shrinking_tumors()
    test_count_responders_returns_plain_int()
    test_count_responders_empty_cohort_is_zero()
    test_summarize_cohort_with_no_eligible_patients_keeps_columns()
    print("All tests passed.")
