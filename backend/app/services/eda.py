import numpy as np
import pandas as pd


def analyze_dataset(df: pd.DataFrame) -> dict:
    """Generate a JSON-safe exploratory data analysis report."""
    if df.empty:
        raise ValueError("Cannot analyze an empty dataset.")

    rows, columns = df.shape
    missing = df.isna().sum()
    missing_percentage = (missing / rows * 100).round(2)
    numeric_columns = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_columns = df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    column_profiles = []
    for column in df.columns:
        series = df[column]
        profile = {
            "name": str(column),
            "data_type": str(series.dtype),
            "missing_values": int(series.isna().sum()),
            "missing_percentage": float(missing_percentage[column]),
            "unique_values": int(series.nunique()),
            "constant": bool(series.nunique() <= 1),
        }
        if pd.api.types.is_numeric_dtype(series):
            clean = series.dropna()
            if not clean.empty:
                profile["statistics"] = {
                    "mean": safe_number(clean.mean()),
                    "median": safe_number(clean.median()),
                    "std": safe_number(clean.std()),
                    "min": safe_number(clean.min()),
                    "max": safe_number(clean.max()),
                }
        else:
            mode = series.mode(dropna=True)
            profile["most_frequent"] = str(mode.iloc[0]) if not mode.empty else None
        column_profiles.append(profile)

    numeric_summary = {}
    if numeric_columns:
        summary = df[numeric_columns].describe()
        numeric_summary = {
            column: {
                statistic: safe_number(value)
                for statistic, value in values.items()
            }
            for column, values in summary.to_dict().items()
        }

    correlation = {}
    if len(numeric_columns) >= 2:
        corr = df[numeric_columns].corr()
        correlation = {
            column: {
                target: safe_number(value)
                for target, value in values.items()
            }
            for column, values in corr.to_dict().items()
        }

    missing_summary = [
        {
            "column": str(column),
            "missing_count": int(missing[column]),
            "missing_percentage": float(missing_percentage[column]),
        }
        for column in df.columns
    ]

    # Histograms: at most 20 bins per numeric column.
    distributions = {}
    for column in numeric_columns:
        clean = pd.to_numeric(df[column], errors="coerce").dropna()
        if clean.empty:
            continue
        bin_count = min(20, max(5, int(np.sqrt(len(clean)))))
        counts, edges = np.histogram(clean.to_numpy(dtype=float), bins=bin_count)
        distributions[str(column)] = [
            {
                "bin_start": safe_number(edges[i]),
                "bin_end": safe_number(edges[i + 1]),
                "count": int(counts[i]),
                "label": f"{format_number(edges[i])}–{format_number(edges[i + 1])}",
            }
            for i in range(len(counts))
        ]

    # IQR outliers: values below Q1 - 1.5*IQR or above Q3 + 1.5*IQR.
    outlier_analysis = {}
    for column in numeric_columns:
        clean = pd.to_numeric(df[column], errors="coerce").dropna()
        if clean.empty:
            continue
        q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        mask = (clean < lower) | (clean > upper)
        values = clean[mask]
        outlier_analysis[str(column)] = {
            "method": "IQR",
            "q1": safe_number(q1),
            "q3": safe_number(q3),
            "iqr": safe_number(iqr),
            "lower_bound": safe_number(lower),
            "upper_bound": safe_number(upper),
            "outlier_count": int(mask.sum()),
            "outlier_percentage": round(float(mask.mean() * 100), 2),
            "outlier_values_sample": [safe_number(v) for v in values.head(10).tolist()],
        }

    # Categorical frequency summaries (top 10 categories per column).
    categorical_analysis = {}
    for column in categorical_columns:
        counts = df[column].dropna().astype(str).value_counts()
        top = counts.head(10)
        categorical_analysis[str(column)] = {
            "total_categories": int(counts.size),
            "missing_values": int(df[column].isna().sum()),
            "frequencies": [
                {"category": str(category), "count": int(count)}
                for category, count in top.items()
            ],
            "other_count": int(counts.iloc[10:].sum()) if counts.size > 10 else 0,
        }

    duplicate_rows = int(df.duplicated().sum())
    constant_columns = [
        str(column) for column in df.columns if df[column].nunique() <= 1
    ]
    total_missing = int(missing.sum())
    total_cells = rows * columns
    completeness = 100 * (1 - total_missing / total_cells) if total_cells else 100
    duplicate_free = 100 * (1 - duplicate_rows / rows)
    non_constant = (
        100 * (1 - len(constant_columns) / columns) if columns else 100
    )
    overall = (completeness + duplicate_free + non_constant) / 3

    quality = {
        "duplicate_rows": duplicate_rows,
        "constant_columns": constant_columns,
        "total_missing_values": total_missing,
        "completeness_score": round(completeness, 2),
        "duplicate_free_score": round(duplicate_free, 2),
        "non_constant_score": round(non_constant, 2),
        "overall_score": round(overall, 2),
        "score_method": (
            "Average of completeness, duplicate-free and non-constant "
            "percentages; a heuristic, not a statistical guarantee."
        ),
    }

    return {
        "overview": {
            "total_rows": int(rows),
            "total_columns": int(columns),
            "numeric_columns": len(numeric_columns),
            "categorical_columns": len(categorical_columns),
            "memory_usage_bytes": int(df.memory_usage(deep=True).sum()),
        },
        "column_profiles": column_profiles,
        "numeric_summary": numeric_summary,
        "correlation_matrix": correlation,
        "missing_values": missing_summary,
        "distributions": distributions,
        "outlier_analysis": outlier_analysis,
        "categorical_analysis": categorical_analysis,
        "quality": quality,
    }


def safe_number(value):
    """Convert numeric values to JSON-safe floats or None."""
    if value is None or pd.isna(value):
        return None
    number = float(value)
    return number if np.isfinite(number) else None


def format_number(value) -> str:
    """Format histogram boundaries compactly."""
    return f"{float(value):.2f}".rstrip("0").rstrip(".")
