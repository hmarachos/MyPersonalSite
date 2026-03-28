#!/bin/bash
cd ~/MyPersonalSite
source venv/bin/activate
export OPENAI_API_KEY="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"
export PROJECT_ENV="asst_2ndEB1goZwfjipYmA0bLEOoC"
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8002
