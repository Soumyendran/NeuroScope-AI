import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Database,
  FileChartColumn,
  FileUp,
  FlaskConical,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 78 },
  { day: "Wed", score: 74 },
  { day: "Thu", score: 85 },
  { day: "Fri", score: 82 },
  { day: "Sat", score: 91 },
  { day: "Sun", score: 88 },
];

const experiments = [
  {
    name: "Customer Churn Prediction",
    algorithm: "Random Forest",
    score: "94.2%",
    status: "Completed",
    date: "Today, 10:42 AM",
  },
  {
    name: "House Price Estimation",
    algorithm: "Linear Regression",
    score: "89.6%",
    status: "Completed",
    date: "Yesterday",
  },
  {
    name: "Sales Forecasting",
    algorithm: "Gradient Boosting",
    score: "91.8%",
    status: "Completed",
    date: "Nov 22, 2026",
  },
  {
    name: "Customer Segmentation",
    algorithm: "K-Means",
    score: "—",
    status: "Processing",
    date: "Nov 21, 2026",
  },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Datasets", icon: Database },
  { label: "Exploratory Analysis", icon: BarChart3 },
  { label: "Model Training", icon: BrainCircuit },
  { label: "Experiments", icon: FlaskConical },
  { label: "Predictions", icon: Activity },
];

interface Dataset {
  id: string;
  filename: string;
  rows: number;
  columns: number;
  missing_values: number;
  duplicate_rows: number;
  memory_usage_bytes: number;
  column_information: {
    name: string;
    data_type: string;
    missing_values: number;
    unique_values: number;
  }[];
  preview: Record<string, unknown>[];
}

interface EDAAnalysis {
  overview: {
    total_rows: number;
    total_columns: number;
    numeric_columns: number;
    categorical_columns: number;
    memory_usage_bytes: number;
  };
  column_profiles: {
    name: string;
    data_type: string;
    missing_values: number;
    missing_percentage: number;
    unique_values: number;
    constant: boolean;
    statistics?: {
      mean: number | null;
      median: number | null;
      std: number | null;
      min: number | null;
      max: number | null;
    };
    most_frequent?: string | null;
  }[];
  numeric_summary: Record<string, Record<string, number | null>>;
  correlation_matrix: Record<string, Record<string, number | null>>;
  missing_values: {
    column: string;
    missing_count: number;
    missing_percentage: number;
  }[];
  distributions?: Record<
    string,
    {
      bin_start: number;
      bin_end: number;
      count: number;
      label: string;
    }[]
  >;
  outlier_analysis?: Record<
    string,
    {
      method: string;
      q1: number | null;
      q3: number | null;
      iqr: number | null;
      lower_bound: number | null;
      upper_bound: number | null;
      outlier_count: number;
      outlier_percentage: number;
      outlier_values_sample: number[];
    }
  >;
  categorical_analysis?: Record<
    string,
    {
      total_categories: number;
      missing_values: number;
      frequencies: { category: string; count: number }[];
      other_count: number;
    }
  >;
  quality: {
    duplicate_rows: number;
    constant_columns: string[];
    total_missing_values: number;
    completeness_score?: number;
    duplicate_free_score?: number;
    non_constant_score?: number;
    overall_score?: number;
    score_method?: string;
  };
}

interface EDAResponse {
  success: boolean;
  dataset_id: string;
  analysis: EDAAnalysis;
}

function ExploratoryAnalysis({ datasets }: { datasets: Dataset[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState<EDAAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distributionColumn, setDistributionColumn] = useState("");

  useEffect(() => {
    if (
      datasets.length > 0 &&
      !datasets.some((item) => item.id === selectedId)
    ) {
      setSelectedId(datasets[0].id);
    }
  }, [datasets, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setAnalysis(null);
      return;
    }

    const controller = new AbortController();
    const loadAnalysis = async () => {
      setLoading(true);
      setError("");
      setAnalysis(null);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/datasets/${selectedId}/eda`,
          { signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || "Could not load EDA analysis.");
        }
        const payload = result as EDAResponse;
        setAnalysis(payload.analysis);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadAnalysis();
    return () => controller.abort();
  }, [selectedId]);

  const panelClass = "bg-[#181b18] border border-[#2b302b] rounded-xl p-5";
  const missingChart =
    analysis?.missing_values
      .filter((item) => item.missing_count > 0)
      .sort((a, b) => b.missing_count - a.missing_count) ?? [];
  const correlations = analysis?.correlation_matrix ?? {};
  const correlationNames = Object.keys(correlations);

  // IDs and binary flags are not useful as continuous histograms or IQR outliers.
  const distributionNames = Object.keys(analysis?.distributions ?? {}).filter(
    (name) => {
      const profile = analysis?.column_profiles.find(
        (item) => item.name === name,
      );
      return (
        !/(^id$|_id$|id$|identifier)/i.test(name) &&
        (profile?.unique_values ?? 0) > 2
      );
    },
  );
  const activeDistribution = distributionNames.includes(distributionColumn)
    ? distributionColumn
    : (distributionNames[0] ?? "");
  const activeHistogram = analysis?.distributions?.[activeDistribution] ?? [];
  const outlierEntries = Object.entries(
    analysis?.outlier_analysis ?? {},
  ).filter(([name, item]) => {
    const profile = analysis?.column_profiles.find(
      (column) => column.name === name,
    );
    return (
      !/(^id$|_id$|id$|identifier)/i.test(name) &&
      (profile?.unique_values ?? 0) > 2 &&
      item.outlier_count > 0
    );
  });
  const categoricalEntries = Object.entries(
    analysis?.categorical_analysis ?? {},
  );

  if (datasets.length === 0) {
    return (
      <section className={panelClass}>
        <h3 className="font-medium text-sm">No dataset available</h3>
        <p className="text-xs text-[#858e85] mt-2">
          Upload a CSV dataset first, then return here to explore it.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section
        className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}
      >
        <div>
          <h3 className="font-medium text-sm">Dataset analysis</h3>
          <p className="text-[11px] text-[#858e85] mt-1">
            Statistical insights generated by the NeuroScope API
          </p>
        </div>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-[240px] max-w-full bg-[#222622] border border-[#394239] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#80b88a]"
        >
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.filename}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <div className={panelClass}>
          <p className="text-sm text-[#a5d9af]">
            Generating exploratory analysis...
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-900 bg-[#2a1b1b] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {analysis && !loading && (
        <>
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ["Rows", analysis.overview.total_rows.toLocaleString()],
              ["Columns", String(analysis.overview.total_columns)],
              ["Missing values", String(analysis.quality.total_missing_values)],
              ["Duplicate rows", String(analysis.quality.duplicate_rows)],
            ].map(([label, value]) => (
              <div key={label} className={panelClass}>
                <p className="text-xs text-[#929a92]">{label}</p>
                <p className="text-2xl font-semibold mt-3">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className={panelClass}>
              <h3 className="text-sm font-medium">Missing values by column</h3>
              <p className="text-[11px] text-[#858e85] mt-1 mb-5">
                Only columns containing missing data are shown.
              </p>
              {missingChart.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={missingChart}
                      layout="vertical"
                      margin={{ left: 20, right: 16 }}
                    >
                      <CartesianGrid
                        stroke="#303630"
                        strokeDasharray="3 5"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="#777f77"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                      />
                      <YAxis
                        dataKey="column"
                        type="category"
                        width={115}
                        stroke="#a0a69f"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#202520",
                          border: "1px solid #414941",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="missing_count"
                        name="Missing values"
                        fill="#d5a85f"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#a5d9af] py-12 text-center">
                  No missing values found.
                </p>
              )}
            </div>

            <div className={panelClass}>
              <h3 className="text-sm font-medium">Dataset quality</h3>
              <p className="text-[11px] text-[#858e85] mt-1 mb-5">
                Automated checks from the uploaded dataset.
              </p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#2b302b] pb-3">
                  <span className="text-[#929a92]">Numeric columns</span>
                  <strong>{analysis.overview.numeric_columns}</strong>
                </div>
                <div className="flex justify-between border-b border-[#2b302b] pb-3">
                  <span className="text-[#929a92]">Categorical columns</span>
                  <strong>{analysis.overview.categorical_columns}</strong>
                </div>
                <div className="flex justify-between border-b border-[#2b302b] pb-3">
                  <span className="text-[#929a92]">Constant columns</span>
                  <strong>{analysis.quality.constant_columns.length}</strong>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#929a92]">Memory usage</span>
                  <strong>
                    {(analysis.overview.memory_usage_bytes / 1024).toFixed(2)}{" "}
                    KB
                  </strong>
                </div>
              </div>
              {analysis.quality.constant_columns.length > 0 && (
                <p className="text-[11px] text-[#e6c17c] mt-4">
                  Constant: {analysis.quality.constant_columns.join(", ")}
                </p>
              )}
            </div>
          </section>

          <section className={panelClass}>
            <h3 className="text-sm font-medium">Correlation heatmap</h3>
            <p className="text-[11px] text-[#858e85] mt-1 mb-5">
              Pearson correlation between numeric columns. Values range from -1
              to +1.
            </p>
            {correlationNames.length >= 2 ? (
              <div className="overflow-x-auto">
                <table className="text-xs border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[#929a92]">Variable</th>
                      {correlationNames.map((name) => (
                        <th
                          key={name}
                          className="p-2 text-[#929a92] whitespace-nowrap"
                        >
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationNames.map((rowName) => (
                      <tr key={rowName}>
                        <th className="p-2 text-left text-[#aeb6ae] whitespace-nowrap">
                          {rowName}
                        </th>
                        {correlationNames.map((columnName) => {
                          const value = correlations[rowName]?.[columnName];
                          const strength = value == null ? 0 : Math.abs(value);
                          const background =
                            value == null
                              ? "#252925"
                              : value >= 0
                                ? `rgba(112, 185, 127, ${0.12 + strength * 0.55})`
                                : `rgba(213, 168, 95, ${0.12 + strength * 0.55})`;
                          return (
                            <td
                              key={columnName}
                              className="p-3 text-center rounded min-w-[76px]"
                              style={{ background }}
                            >
                              {value == null ? "—" : value.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#858e85]">
                At least two numeric columns are needed for a correlation
                matrix.
              </p>
            )}
            <div className="flex gap-4 mt-4 text-[10px] text-[#858e85]">
              <span>Green: positive correlation</span>
              <span>Amber: negative correlation</span>
            </div>
          </section>

          {/* ADVANCED EDA */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-medium">Numeric distribution</h3>
                  <p className="text-[11px] text-[#858e85] mt-1">
                    Histogram generated from the uploaded values.
                  </p>
                </div>
                {distributionNames.length > 0 && (
                  <select
                    value={activeDistribution}
                    onChange={(event) =>
                      setDistributionColumn(event.target.value)
                    }
                    className="max-w-[180px] bg-[#222622] border border-[#394239] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#80b88a]"
                  >
                    {distributionNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {activeHistogram.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeHistogram}
                      margin={{ top: 8, right: 8, left: -18, bottom: 28 }}
                    >
                      <CartesianGrid
                        stroke="#303630"
                        strokeDasharray="3 5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="#777f77"
                        tickLine={false}
                        axisLine={false}
                        fontSize={9}
                        angle={-35}
                        textAnchor="end"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#777f77"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#202520",
                          border: "1px solid #414941",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Records"
                        fill="#8bc998"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#858e85] py-12 text-center">
                  No continuous numeric distributions available.
                </p>
              )}
            </div>

            <div className={panelClass}>
              <h3 className="text-sm font-medium">Outlier detection</h3>
              <p className="text-[11px] text-[#858e85] mt-1 mb-4">
                IQR method · identifier and binary columns excluded from this
                summary.
              </p>
              {outlierEntries.length > 0 ? (
                <div className="space-y-3">
                  {outlierEntries.map(([name, item]) => (
                    <div
                      key={name}
                      className="rounded-lg bg-[#202520] border border-[#303830] p-3"
                    >
                      <div className="flex justify-between gap-3 text-xs">
                        <span className="font-medium">{name}</span>
                        <span className="text-[#e6c17c]">
                          {item.outlier_count} outliers ·{" "}
                          {item.outlier_percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#343a34] mt-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#d5a85f]"
                          style={{
                            width: `${Math.min(item.outlier_percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#858e85] mt-2">
                        Bounds: {item.lower_bound?.toFixed(2) ?? "—"} to{" "}
                        {item.upper_bound?.toFixed(2) ?? "—"}
                        {item.outlier_values_sample.length > 0
                          ? ` · Sample: ${item.outlier_values_sample.slice(0, 5).join(", ")}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#a5d9af] py-12 text-center">
                  No outliers detected in eligible columns.
                </p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className={panelClass}>
              <h3 className="text-sm font-medium">Categorical frequency</h3>
              <p className="text-[11px] text-[#858e85] mt-1 mb-5">
                Most frequent values in each categorical column.
              </p>
              {categoricalEntries.length > 0 ? (
                <div className="space-y-5">
                  {categoricalEntries.map(([name, item]) => (
                    <div key={name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium">{name}</span>
                        <span className="text-[10px] text-[#858e85]">
                          {item.total_categories} categories
                        </span>
                      </div>
                      <div className="space-y-2">
                        {item.frequencies.slice(0, 5).map((entry) => {
                          const maxCount = Math.max(
                            ...item.frequencies.map((value) => value.count),
                            1,
                          );
                          return (
                            <div
                              key={entry.category}
                              className="grid grid-cols-[minmax(70px,1fr)_2fr_36px] items-center gap-2 text-[10px]"
                            >
                              <span
                                className="text-[#aeb6ae] truncate"
                                title={entry.category}
                              >
                                {entry.category}
                              </span>
                              <div className="h-1.5 bg-[#343a34] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#8bc998] rounded-full"
                                  style={{
                                    width: `${(entry.count / maxCount) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-right text-[#c4cbc4] tabular-nums">
                                {entry.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {item.missing_values > 0 && (
                        <p className="text-[10px] text-[#d5a85f] mt-2">
                          {item.missing_values} missing values
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#858e85] py-12 text-center">
                  No categorical columns found.
                </p>
              )}
            </div>

            <div className={panelClass}>
              <h3 className="text-sm font-medium">Data quality score</h3>
              <p className="text-[11px] text-[#858e85] mt-1 mb-5">
                A heuristic score based on completeness, duplicate-free rows and
                non-constant columns.
              </p>
              {analysis.quality.overall_score != null ? (
                <>
                  <div className="flex items-end gap-2 mb-5">
                    <span className="text-4xl font-semibold text-[#a5d9af] tabular-nums">
                      {analysis.quality.overall_score.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-[#858e85] mb-1">
                      overall quality
                    </span>
                  </div>
                  {[
                    ["Completeness", analysis.quality.completeness_score],
                    ["Duplicate-free", analysis.quality.duplicate_free_score],
                    [
                      "Non-constant columns",
                      analysis.quality.non_constant_score,
                    ],
                  ].map(([label, score]) => (
                    <div key={String(label)} className="mb-4">
                      <div className="flex justify-between text-[11px] mb-2">
                        <span className="text-[#aeb6ae]">{label}</span>
                        <span className="tabular-nums">
                          {typeof score === "number"
                            ? `${score.toFixed(2)}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#343a34] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8bc998]"
                          style={{
                            width: `${typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-[#777f77] mt-4">
                    {analysis.quality.score_method}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#858e85] py-12 text-center">
                  Your backend response does not include the quality score yet.
                  Restart the API and re-run EDA.
                </p>
              )}
            </div>
          </section>

          <section className={`${panelClass} overflow-hidden`}>
            <h3 className="text-sm font-medium mb-1">Column profiles</h3>
            <p className="text-[11px] text-[#858e85] mb-4">
              Data types, missing values, unique values and numeric statistics.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-[#899189] bg-[#202420]">
                  <tr>
                    {[
                      "Column",
                      "Type",
                      "Missing",
                      "Unique",
                      "Mean",
                      "Median",
                      "Min",
                      "Max",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.column_profiles.map((column) => (
                    <tr key={column.name} className="border-t border-[#292e29]">
                      <td className="px-3 py-3 font-medium">{column.name}</td>
                      <td className="px-3 py-3 text-[#a1a9a1]">
                        {column.data_type}
                      </td>
                      <td className="px-3 py-3 text-[#e6c17c]">
                        {column.missing_values} ({column.missing_percentage}%)
                      </td>
                      <td className="px-3 py-3">{column.unique_values}</td>
                      <td className="px-3 py-3">
                        {column.statistics?.mean?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {column.statistics?.median?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {column.statistics?.min?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {column.statistics?.max?.toFixed(2) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [search, setSearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/v1/health");
        if (!response.ok) throw new Error("Backend unavailable");
        const data = await response.json();
        if (active) setBackendStatus(data.status);
      } catch {
        if (active) setBackendStatus("offline");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setUploadMessage("");
    setSelectedFile(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadMessage("Please select a CSV file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadMessage("File size must be below 20 MB.");
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadMessage("Uploading and analyzing dataset...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/datasets/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Dataset upload failed.");
      }

      const uploadedDataset: Dataset = result.dataset;

      setDatasets((previous) => [
        uploadedDataset,
        ...previous.filter((dataset) => dataset.id !== uploadedDataset.id),
      ]);

      setUploadMessage(`${file.name} uploaded successfully!`);
    } catch (error) {
      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const filteredExperiments = experiments.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const pageDescription: Record<string, string> = {
    Overview: "Your machine learning workspace at a glance.",
    Datasets: "Manage and explore your datasets.",
    "Exploratory Analysis":
      "Understand your data through statistical analysis.",
    "Model Training": "Build and train machine learning models.",
    Experiments: "Track and compare your ML experiments.",
    Predictions: "Generate predictions using trained models.",
  };

  return (
    <div className="min-h-screen bg-[#101110] text-[#e8e9e6] flex">
      {/* SIDEBAR */}
      <aside className="w-[250px] shrink-0 border-r border-[#292c29] bg-[#151715] min-h-screen flex flex-col max-md:hidden">
        <div className="h-[82px] flex items-center gap-3 px-6 border-b border-[#292c29]">
          <div className="w-9 h-9 rounded-xl bg-[#244a32] flex items-center justify-center">
            <BrainCircuit size={21} className="text-[#a2d6ad]" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-[16px]">
              NeuroScope
            </h1>
            <p className="text-[10px] tracking-[2px] text-[#8c958c] uppercase">
              Intelligence platform
            </p>
          </div>
        </div>

        <div className="px-4 pt-8">
          <p className="text-[10px] font-semibold tracking-[1.8px] text-[#727a72] uppercase px-3 mb-3">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActivePage(label)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] transition-colors ${
                  activePage === label
                    ? "bg-[#243a2a] text-[#a5d9af]"
                    : "text-[#929991] hover:bg-[#202420] hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
                {label === "Datasets" && (
                  <span className="ml-auto text-[10px] bg-[#292d29] px-2 py-1 rounded-md">
                    {datasets.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-1 border-t border-[#292c29]">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-[#929991] hover:text-white text-[13px]">
            <Settings size={17} /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-[#929991] hover:text-white text-[13px]">
            <CircleHelp size={17} /> Help & Support
          </button>

          <div className="mt-4 p-3 rounded-xl bg-[#202820] border border-[#354437]">
            <div className="flex items-center gap-2 text-[#a5d9af] text-xs">
              <ShieldCheck size={16} /> Local workspace
            </div>
            <p className="text-[11px] text-[#899389] mt-2">
              Your data stays on your local development environment.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">
        {/* HEADER */}
        <header className="h-[82px] border-b border-[#292c29] flex items-center justify-between px-8 max-sm:px-4">
          <div>
            <p className="text-[11px] text-[#818981]">
              Workspace / {activePage}
            </p>
            <h2 className="font-semibold text-[18px] mt-1">{activePage}</h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "healthy"
                    ? "bg-[#7cc88d]"
                    : backendStatus === "offline"
                      ? "bg-red-500"
                      : "bg-amber-400"
                }`}
              />
              <span className="text-[#a0a69f]">
                API{" "}
                {backendStatus === "healthy"
                  ? "Connected"
                  : backendStatus === "offline"
                    ? "Offline"
                    : "Checking"}
              </span>
            </div>
            <button className="text-[#9ca49c] hover:text-white">
              <Bell size={19} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#344c38] flex items-center justify-center text-[#b7e0bd] text-xs font-semibold">
                NS
              </div>
              <ChevronDown size={14} className="text-[#858d85] max-sm:hidden" />
            </div>
          </div>
        </header>

        <div className="p-8 max-lg:p-5 max-sm:p-4 max-w-[1500px] mx-auto">
          {/* WELCOME */}
          <section className="flex justify-between items-start gap-4 mb-8 max-sm:flex-col">
            <div>
              <p className="text-[#8e978e] text-xs mb-2">
                MONDAY, NOVEMBER 24, 2026
              </p>
              <h1 className="text-2xl sm:text-[29px] font-semibold tracking-tight">
                Welcome to NeuroScope<span className="text-[#91c99c]">.</span>
              </h1>
              <p className="text-sm text-[#858d85] mt-2">
                {pageDescription[activePage]}
              </p>
            </div>

            <button
              disabled={isUploading}
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 bg-[#a4d5ae] text-[#142017] hover:bg-[#b7e3bf] disabled:opacity-60 px-4 py-3 rounded-lg text-xs font-semibold transition-colors"
            >
              {isUploading ? (
                <Activity size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {isUploading ? "Uploading..." : "New Dataset"}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </section>

          {/* FILE SELECTION */}
          {selectedFile && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#354c39] bg-[#1c2a1e] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileUp className="text-[#a4d5ae] shrink-0" size={19} />
                <div className="min-w-0">
                  <p className="text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[#89968a]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadMessage("");
                }}
                aria-label="Remove selected file"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {uploadMessage && (
            <p className="text-xs text-[#a5d9af] mb-5">{uploadMessage}</p>
          )}

          {activePage === "Exploratory Analysis" ? (
            <ExploratoryAnalysis datasets={datasets} />
          ) : (
            <>
              {/* STAT CARDS */}
              <section className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1 mb-6">
                {[
                  {
                    label: "Total Datasets",
                    value: String(datasets.length),
                    detail: "Successfully uploaded datasets",
                    icon: Database,
                  },
                  {
                    label: "Models Trained",
                    value: "0",
                    detail: "No models trained yet",
                    icon: BrainCircuit,
                  },
                  {
                    label: "Experiments",
                    value: "0",
                    detail: "Your experiment history",
                    icon: FlaskConical,
                  },
                  {
                    label: "Best Model Score",
                    value: "—",
                    detail: "Awaiting first model",
                    icon: Activity,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#181b18] border border-[#2b302b] rounded-xl p-5 hover:border-[#455448] transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#929a92]">
                        {item.label}
                      </span>
                      <item.icon size={18} className="text-[#8ebc96]" />
                    </div>
                    <h3 className="text-3xl font-semibold mt-5 tracking-tight">
                      {item.value}
                    </h3>
                    <p className="text-[11px] text-[#7d857d] mt-2">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </section>

              {/* UPLOADED DATASETS */}
              {datasets.length > 0 && (
                <section className="bg-[#181b18] border border-[#2b302b] rounded-xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-sm font-medium">Uploaded Datasets</h3>
                      <p className="text-[11px] text-[#7e877e] mt-1">
                        Real datasets processed by NeuroScope AI
                      </p>
                    </div>
                    <Database size={19} className="text-[#8ebc96]" />
                  </div>

                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#202520] border border-[#303830]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#293d2d] flex items-center justify-center">
                            <FileChartColumn
                              size={19}
                              className="text-[#a5d9af]"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {dataset.filename}
                            </p>
                            <p className="text-[11px] text-[#858e85] mt-1">
                              {dataset.rows.toLocaleString()} rows ·{" "}
                              {dataset.columns} columns
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-5 text-xs">
                          <div>
                            <p className="text-[#858e85]">Missing</p>
                            <p className="text-[#e6c17c] font-semibold mt-1">
                              {dataset.missing_values}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#858e85]">Duplicates</p>
                            <p className="text-[#a5d9af] font-semibold mt-1">
                              {dataset.duplicate_rows}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CHART AND QUICK ACTIONS */}
              <section className="grid grid-cols-3 gap-5 max-xl:grid-cols-1 mb-6">
                <div className="col-span-2 bg-[#181b18] border border-[#2b302b] rounded-xl p-5">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-medium text-sm">
                        Model Performance Overview
                      </h3>
                      <p className="text-[11px] text-[#7e877e] mt-1">
                        Illustrative sample data · Not actual experiments
                      </p>
                    </div>
                    <button className="text-xs text-[#a6afa6] border border-[#353a35] rounded-md px-3 py-2">
                      Last 7 days{" "}
                      <ChevronDown size={13} className="inline ml-1" />
                    </button>
                  </div>

                  <div className="h-[235px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="scoreGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#80c58e"
                              stopOpacity={0.23}
                            />
                            <stop
                              offset="100%"
                              stopColor="#80c58e"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="#303630"
                          strokeDasharray="3 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          stroke="#777f77"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#777f77"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#202520",
                            border: "1px solid #414941",
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#8bc998"
                          strokeWidth={2}
                          fill="url(#scoreGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#181b18] border border-[#2b302b] rounded-xl p-5">
                  <h3 className="font-medium text-sm">Quick Actions</h3>
                  <p className="text-[11px] text-[#7e877e] mt-1 mb-5">
                    Start a new workflow
                  </p>

                  {[
                    {
                      label: "Upload Dataset",
                      sub: "Import a CSV file",
                      icon: Upload,
                      action: () => fileInput.current?.click(),
                    },
                    {
                      label: "Explore Data",
                      sub: "Start exploratory analysis",
                      icon: BarChart3,
                      action: () => setActivePage("Exploratory Analysis"),
                    },
                    {
                      label: "Train Model",
                      sub: "Build a machine learning model",
                      icon: BrainCircuit,
                      action: () => setActivePage("Model Training"),
                    },
                    {
                      label: "View Experiments",
                      sub: "Review previous experiments",
                      icon: FileChartColumn,
                      action: () => setActivePage("Experiments"),
                    },
                  ].map(({ label, sub, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-[#252b25] transition-colors mb-1"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#27392b] flex items-center justify-center text-[#a4d5ae]">
                        <Icon size={17} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[10px] text-[#858e85] mt-1">{sub}</p>
                      </div>
                      <Plus size={15} className="text-[#858e85]" />
                    </button>
                  ))}
                </div>
              </section>

              {/* EXPERIMENTS TABLE */}
              <section className="bg-[#181b18] border border-[#2b302b] rounded-xl overflow-hidden mb-6">
                <div className="p-5 flex justify-between items-center gap-3 max-sm:flex-col max-sm:items-start">
                  <div>
                    <h3 className="text-sm font-medium">Recent Experiments</h3>
                    <p className="text-[11px] text-[#7e877e] mt-1">
                      Sample interface data · No experiments stored yet
                    </p>
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788078]"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search experiments..."
                      className="bg-[#222622] border border-[#353a35] rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-[#80b88a] w-[190px]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[650px]">
                    <thead className="bg-[#202420] text-[10px] uppercase tracking-wider text-[#899189]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Experiment</th>
                        <th className="px-5 py-3 font-medium">Algorithm</th>
                        <th className="px-5 py-3 font-medium">Score</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExperiments.map((item) => (
                        <tr
                          key={item.name}
                          className="border-t border-[#292e29] hover:bg-[#202420] transition-colors"
                        >
                          <td className="px-5 py-4 text-xs font-medium">
                            {item.name}
                          </td>
                          <td className="px-5 py-4 text-xs text-[#a1a9a1]">
                            {item.algorithm}
                          </td>
                          <td className="px-5 py-4 text-xs text-[#a5d9af] font-medium">
                            {item.score}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`text-[10px] px-2 py-1 rounded-full ${
                                item.status === "Completed"
                                  ? "bg-[#263c2b] text-[#a5d9af]"
                                  : "bg-[#443923] text-[#e6c17c]"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-[#899189]">
                            {item.date}
                          </td>
                          <td className="px-5 py-4 text-[#858e85]">
                            <MoreHorizontal size={17} />
                          </td>
                        </tr>
                      ))}
                      {filteredExperiments.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-xs text-[#858e85]"
                          >
                            No matching experiments.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* FOOTER */}
          <footer className="flex justify-between items-center text-[10px] text-[#737b73] py-3 max-sm:flex-col gap-2">
            <span>NEUROSCOPE AI · VERSION 0.1.0</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#82c68e]" />
              Built for intelligent data science
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
