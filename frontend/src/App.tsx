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
  CartesianGrid,
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
                    0
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
                  <span className="text-xs text-[#929a92]">{item.label}</span>
                  <item.icon size={18} className="text-[#8ebc96]" />
                </div>
                <h3 className="text-3xl font-semibold mt-5 tracking-tight">
                  {item.value}
                </h3>
                <p className="text-[11px] text-[#7d857d] mt-2">{item.detail}</p>
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
                        <FileChartColumn size={19} className="text-[#a5d9af]" />
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
                  Last 7 days <ChevronDown size={13} className="inline ml-1" />
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
