
from io import BytesIO
from uuid import uuid4

import pandas as pd

from fastapi import APIRouter, File, HTTPException, UploadFile
from backend.app.services.eda import analyze_dataset

router = APIRouter(
    prefix="/api/v1/datasets",
    tags=["Datasets"],
)

# Maximum CSV upload size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Temporary local dataset registry.
# DataFrames remain available while the backend process is running.
DATASETS: dict[str, pd.DataFrame] = {}


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    # Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    # Read file with a size limit
    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 20 MB limit.",
        )

    # Parse CSV
    try:
        df = pd.read_csv(
            BytesIO(content),
            encoding="utf-8-sig",
            on_bad_lines="error",
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file encoding. Please upload a UTF-8 CSV.",
        )
    except (pd.errors.ParserError, pd.errors.EmptyDataError):
        raise HTTPException(
            status_code=400,
            detail="Unable to parse the CSV. Check its format and contents.",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this CSV file.",
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="The CSV contains no data rows.",
        )

    if len(df.columns) == 0:
        raise HTTPException(
            status_code=400,
            detail="The CSV contains no columns.",
        )

    # Generate a unique dataset identifier
    dataset_id = str(uuid4())

    # Keep the DataFrame available for future EDA and ML operations
    DATASETS[dataset_id] = df

    # Column information
    columns = []

    for column in df.columns:
        series = df[column]

        columns.append({
            "name": str(column),
            "data_type": str(series.dtype),
            "missing_values": int(series.isna().sum()),
            "unique_values": int(series.nunique()),
        })

    # Safely prepare preview records
    preview_df = df.head(10).astype(object)
    preview_df = preview_df.where(pd.notna(preview_df), None)

    preview = preview_df.to_dict(orient="records")

    return {
        "success": True,
        "message": "Dataset uploaded and analyzed successfully.",
        "dataset": {
            "id": dataset_id,
            "filename": file.filename,
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "memory_usage_bytes": int(
                df.memory_usage(deep=True).sum()
            ),
            "missing_values": int(df.isna().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
            "column_information": columns,
            "preview": preview,
        },
    }


@router.get("/")
async def list_datasets():
    return {
        "total": len(DATASETS),
        "datasets": [
            {
                "id": dataset_id,
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
            }
            for dataset_id, df in DATASETS.items()
        ],
    }


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    df = DATASETS.get(dataset_id)

    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. It may have been cleared after a server restart.",
        )

    return {
        "id": dataset_id,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_information": [
            {
                "name": str(column),
                "data_type": str(df[column].dtype),
                "missing_values": int(df[column].isna().sum()),
                "unique_values": int(df[column].nunique()),
            }
            for column in df.columns
        ],
    }


@router.get("/{dataset_id}/eda")
async def get_dataset_eda(dataset_id: str):
    """Generate exploratory data analysis for a dataset."""

    df = DATASETS.get(dataset_id)

    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Upload the dataset again.",
        )

    try:
        analysis = analyze_dataset(df)

        return {
            "success": True,
            "dataset_id": dataset_id,
            "analysis": analysis,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"EDA analysis failed: {str(error)}",
        )
