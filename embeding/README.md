start env:
.\venv\Scripts\Activate.ps1
run file:
uvicorn embed_api:app --host 0.0.0.0 --port 8000 --reload
