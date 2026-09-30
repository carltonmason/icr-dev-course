"""Tests for tumor growth analysis."""
import math
import pandas as pd
from good_analysis import (
    calculate_sphere_volume,
    compute_growth_rate,
    filter_valid_measurements,
    is_responder,
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


if __name__ == '__main__':
    test_sphere_volume_known_value()
    test_sphere_volume_zero()
    test_shrinking_tumor_is_responder()
    test_growing_tumor_is_not_responder()
    test_filter_drops_negative_diameters_and_keeps_zero()
    print("All tests passed.")
