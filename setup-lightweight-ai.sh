#!/bin/bash

echo "🚀 통풍 관리 앱용 경량 AI 설치 스크립트"
echo "========================================="

# 1. Ollama 설치 (Mac/Linux)
if ! command -v ollama &> /dev/null; then
    echo "📦 Ollama 설치 중..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama 이미 설치됨"
fi

# 2. 경량 모델 다운로드
echo ""
echo "📥 경량 모델 다운로드 (총 8GB 필요)"
echo "-----------------------------------"

# Gemma 2B - Google (가장 균형잡힌 선택)
echo "1️⃣ Gemma 2B 다운로드 중... (1.5GB)"
ollama pull gemma:2b

# Qwen2.5 1.5B - 한국어 최강
echo "2️⃣ Qwen2.5 1.5B 다운로드 중... (1GB)"
ollama pull qwen2.5:1.5b

# Phi-3 Mini - 복잡한 추론
echo "3️⃣ Phi-3 Mini 다운로드 중... (2.3GB)"
ollama pull phi3:mini

# 선택사항: 의료 특화 모델
read -p "의료 특화 모델도 설치하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "4️⃣ MedLlama2 다운로드 중... (3.8GB)"
    ollama pull medllama2:latest
fi

# 3. Ollama 서버 시작
echo ""
echo "🎯 Ollama 서버 시작 중..."
ollama serve &
OLLAMA_PID=$!
sleep 3

# 4. 모델 테스트
echo ""
echo "🧪 모델 테스트"
echo "-------------"

# Gemma 테스트
echo "Testing Gemma 2B..."
curl -s http://localhost:11434/api/generate -d '{
  "model": "gemma:2b",
  "prompt": "What foods should gout patients avoid? (answer in 1 sentence)",
  "stream": false
}' | jq -r '.response' | head -n 2

echo ""

# Qwen 테스트 (한국어)
echo "Testing Qwen 1.5B (Korean)..."
curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:1.5b",
  "prompt": "통풍 환자가 피해야 할 음식은? (한 문장으로)",
  "stream": false
}' | jq -r '.response' | head -n 2

echo ""
echo "✅ 설치 완료!"
echo ""
echo "📋 사용 방법:"
echo "1. 서버 시작: ollama serve"
echo "2. 앱에서 설정: AI_PROVIDER=local-llm"
echo "3. 모델 변경: services/ai/SmartGoutAI.ts 수정"
echo ""
echo "💡 팁: 개발시에는 Gemma 2B, 한국 사용자가 많으면 Qwen 1.5B 추천"