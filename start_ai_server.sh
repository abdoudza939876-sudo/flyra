#!/bin/bash
cd "$(dirname "$0")"
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.2
python3 ai.py &
echo "Morpheus AI Server started on http://localhost:5001"
