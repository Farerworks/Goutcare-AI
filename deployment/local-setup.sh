#!/bin/bash

# 옵션 1: Ollama 설치 (가장 쉬움)
echo "=== Ollama 로컬 설치 ==="

# Mac
curl -fsSL https://ollama.ai/install.sh | sh

# 모델 다운로드 (통풍 관리에 최적)
ollama pull llama3.2:3b        # 가장 가벼움, 4GB RAM
ollama pull qwen2.5:7b          # 한국어 최강
ollama pull medllama2:7b        # 의료 특화

# Ollama 서버 시작
ollama serve

# 테스트
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "통풍에 좋은 음식을 추천해줘",
  "stream": false
}'