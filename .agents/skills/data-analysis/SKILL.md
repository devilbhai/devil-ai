---
name: data-analysis
description: Data analysis patterns. Statistical analysis, trend detection, anomaly identification.
---

# Data Analysis

## When to Apply
Use this skill when performing data analysis tasks, including statistical analysis, trend detection, anomaly identification, data cleaning, and insight generation from structured datasets.

## Core Concepts
- **Statistical Analysis**: Descriptive statistics, hypothesis testing, confidence intervals, p-values, effect sizes
- **Trend Detection**: Time series analysis, moving averages, seasonal decomposition, trend lines
- **Anomaly Detection**: Z-score, IQR method, isolation forests, DBSCAN, statistical process control
- **Data Cleaning**: Missing value handling, outlier treatment, normalization, standardization
- **Visualization**: Chart selection, effective storytelling, interactive dashboards
- **Correlation Analysis**: Pearson, Spearman, correlation matrices, confounding variables
- **Regression Analysis**: Linear, logistic, multivariate, polynomial, feature importance
- **Libraries**: Pandas, NumPy, SciPy, scikit-learn, matplotlib, seaborn, plotly

## Implementation
```python
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class AnalysisResult:
    metric: str
    value: float
    p_value: Optional[float]
    confidence_interval: Optional[Tuple[float, float]]
    interpretation: str

class DataAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def descriptive_stats(self, columns: Optional[List[str]] = None) -> Dict:
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        stats_dict = {}
        for col in columns:
            if col in self.df.columns:
                stats_dict[col] = {
                    "mean": float(self.df[col].mean()),
                    "median": float(self.df[col].median()),
                    "std": float(self.df[col].std()),
                    "min": float(self.df[col].min()),
                    "max": float(self.df[col].max()),
                    "skewness": float(self.df[col].skew()),
                    "kurtosis": float(self.df[col].kurtosis()),
                    "null_count": int(self.df[col].isnull().sum()),
                    "null_pct": float(self.df[col].isnull().mean() * 100)
                }
        return stats_dict

    def detect_trends(
        self, time_col: str, value_col: str, window: int = 7
    ) -> Dict:
        df = self.df.sort_values(time_col).copy()
        df['moving_avg'] = df[value_col].rolling(window=window).mean()
        df['moving_std'] = df[value_col].rolling(window=window).std()

        # Linear trend
        x = np.arange(len(df))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, df[value_col])

        # Mann-Kendall trend test
        n = len(df)
        s = 0
        for k in range(n - 1):
            for j in range(k + 1, n):
                s += np.sign(df[value_col].iloc[j] - df[value_col].iloc[k])

        variance = n * (n - 1) * (2 * n + 5) / 18
        z = (s - np.sign(s)) / np.sqrt(variance) if variance > 0 else 0
        trend_p_value = 2 * (1 - stats.norm.cdf(abs(z)))

        return {
            "linear_slope": slope,
            "linear_intercept": intercept,
            "r_squared": r_value ** 2,
            "linear_p_value": p_value,
            "mann_kendall_z": z,
            "mann_kendall_p_value": trend_p_value,
            "trend_direction": "increasing" if slope > 0 else "decreasing",
            "is_significant": p_value < 0.05
        }

    def detect_anomalies(
        self, column: str, method: str = "iqr", threshold: float = 1.5
    ) -> pd.DataFrame:
        df = self.df.copy()

        if method == "iqr":
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - threshold * IQR
            upper = Q3 + threshold * IQR
            df['is_anomaly'] = (df[column] < lower) | (df[column] > upper)
            df['anomaly_score'] = np.where(
                df[column] < lower, (lower - df[column]) / IQR,
                np.where(df[column] > upper, (df[column] - upper) / IQR, 0)
            )

        elif method == "zscore":
            z_scores = np.abs(stats.zscore(df[column].dropna()))
            df['is_anomaly'] = False
            df.loc[df[column].dropna().index, 'is_anomaly'] = z_scores > threshold
            df['anomaly_score'] = 0.0
            df.loc[df[column].dropna().index, 'anomaly_score'] = z_scores

        elif method == "modified_zscore":
            median = df[column].median()
            mad = np.median(np.abs(df[column] - median))
            modified_z = 0.6745 * (df[column] - median) / mad if mad > 0 else 0
            df['is_anomaly'] = np.abs(modified_z) > threshold
            df['anomaly_score'] = np.abs(modified_z)

        return df

    def correlation_analysis(
        self, method: str = "pearson"
    ) -> Tuple[pd.DataFrame, List[Dict]]:
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        corr_matrix = self.df[numeric_cols].corr(method=method)

        # Find significant correlations
        significant_pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col1, col2 = numeric_cols[i], numeric_cols[j]
                corr = corr_matrix.loc[col1, col2]

                # Calculate p-value
                if method == "pearson":
                    _, p_value = stats.pearsonr(
                        self.df[col1].dropna(), self.df[col2].dropna()
                    )
                elif method == "spearman":
                    _, p_value = stats.spearmanr(
                        self.df[col1].dropna(), self.df[col2].dropna()
                    )

                if abs(corr) > 0.3 and p_value < 0.05:
                    significant_pairs.append({
                        "col1": col1,
                        "col2": col2,
                        "correlation": corr,
                        "p_value": p_value,
                        "strength": "strong" if abs(corr) > 0.7 else "moderate"
                    })

        return corr_matrix, significant_pairs

    def compare_groups(
        self, group_col: str, value_col: str, test: str = "anova"
    ) -> Dict:
        groups = [group[value_col].dropna() for _, group in self.df.groupby(group_col)]

        if test == "anova":
            f_stat, p_value = stats.f_oneway(*groups)
            return {
                "test": "one-way ANOVA",
                "f_statistic": f_stat,
                "p_value": p_value,
                "is_significant": p_value < 0.05,
                "effect_size": f_stat / (len(self.df) - len(groups))
            }

        elif test == "kruskal":
            h_stat, p_value = stats.kruskal(*groups)
            return {
                "test": "Kruskal-Wallis",
                "h_statistic": h_stat,
                "p_value": p_value,
                "is_significant": p_value < 0.05
            }

    def time_series_decompose(
        self, time_col: str, value_col: str, period: int = 7
    ) -> Dict:
        from statsmodels.tsa.seasonal import seasonal_decompose

        df = self.df.sort_values(time_col).set_index(time_col)
        series = df[value_col]

        decomposition = seasonal_decompose(series, model='additive', period=period)

        return {
            "trend": decomposition.trend.dropna().tolist(),
            "seasonal": decomposition.seasonal.dropna().tolist(),
            "residual": decomposition.resid.dropna().tolist(),
            "trend_strength": 1 - (decomposition.resid.var() /
                (decomposition.resid + decomposition.trend).var())
        }

def generate_analysis_report(analyzer: DataAnalyzer) -> str:
    report = []
    report.append("# Data Analysis Report\n")

    # Descriptive stats
    stats = analyzer.descriptive_stats()
    report.append("## Descriptive Statistics")
    for col, s in stats.items():
        report.append(f"\n### {col}")
        report.append(f"- Mean: {s['mean']:.2f}")
        report.append(f"- Std: {s['std']:.2f}")
        report.append(f"- Range: [{s['min']:.2f}, {s['max']:.2f}]")

    # Correlations
    _, sig_pairs = analyzer.correlation_analysis()
    if sig_pairs:
        report.append("\n## Significant Correlations")
        for pair in sig_pairs[:10]:
            report.append(
                f"- {pair['col1']} ↔ {pair['col2']}: "
                f"r={pair['correlation']:.3f} (p={pair['p_value']:.4f})"
            )

    return '\n'.join(report)
```

## Best Practices
- Always check data quality (missing values, outliers) before analysis
- Use appropriate statistical tests based on data distribution and sample size
- Report confidence intervals alongside point estimates
- Distinguish correlation from causation in all interpretations
- Use effect sizes (Cohen's d, eta-squared) alongside p-values
- Visualize data before and after transformations
- Document all data cleaning steps for reproducibility
- Use multiple anomaly detection methods and compare results
