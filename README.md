# NeuroScope AI

An intelligent data science and machine learning platform.

NeuroScope AI helps users upload datasets, perform exploratory data analysis, train machine learning models, evaluate performance, and generate predictions through a web interface.

## Features

- CSV dataset upload and validation
- Dataset profiling and statistics
- Automated exploratory data analysis
- Machine learning model training
- Model evaluation and comparison
- Explainable AI
- Prediction studio
- Experiment tracking

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn

## Project Structure

```text
neuroscope-ai/
├── backend/
├── frontend/
├── docs/
├── screenshots/
├── tests/
├── .gitignore
└── README.md
```

## Local Development

### Backend

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Application URLs

- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000
- API Documentation: http://127.0.0.1:8000/docs

## Project Status

Phase 1: Foundation and initial dataset upload integration.

## License

MIT License
