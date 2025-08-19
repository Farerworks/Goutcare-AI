# 🚀 LM Studio 성능 최적화 가이드

## 📊 현재 상황 분석
- ✅ 모델 로드됨: google/gemma-3n-e4b
- ❌ 응답 속도: 2분+ (목표: 5초 이내)
- ✅ CORS 프록시 작동
- ❌ 웹앱 연동 불안정

## 🔧 LM Studio 최적화 설정

### 1. 모델 설정 최적화
**LM Studio에서 확인/변경할 설정들:**

1. **Model 탭에서:**
   - Model: `google/gemma-3n-e4b` 확인
   - GPU Acceleration: ✅ 활성화
   - GPU Layers: 자동 또는 최대값

2. **Chat 탭에서 테스트:**
   ```
   사용자: 안녕
   기대응답: 2-5초 내 응답
   ```

3. **Server 탭에서:**
   - Port: 1234 (기본값)
   - ✅ Enable CORS
   - ✅ Allow remote connections
   - Max Context: 2048 (기본값)
   - Max Tokens: 512 (응답 제한)

### 2. 성능 설정 조정
**LM Studio 고급 설정:**
- **Temperature**: 0.7 (창의성과 일관성 균형)
- **Top-k**: 40
- **Top-p**: 0.95
- **Repeat Penalty**: 1.1
- **GPU Memory**: 최대 할당

### 3. 시스템 리소스 확인
```bash
# GPU 메모리 사용량 확인 (NVIDIA)
nvidia-smi

# CPU/RAM 사용량 확인
top -o cpu

# 프로세스 확인
ps aux | grep -i lmstudio
```

### 4. 모델 재로드
1. **LM Studio에서:**
   - Model 탭 → Unload Model
   - 잠시 대기 (5초)
   - Load Model 다시 클릭
   - "Model loaded successfully" 확인

### 5. 연결 테스트
```bash
# 빠른 테스트 (5초 이내 응답 기대)
time curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemma-3n-e4b",
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 50,
    "temperature": 0.7
  }'
```

## 🎯 예상 성능 목표
- **응답 시간**: 1-5초
- **GPU 사용률**: 70-90%
- **메모리 사용량**: 3-4GB
- **안정성**: 연속 10회 요청 성공

## 🚨 문제 해결
### A. 응답이 여전히 느린 경우
1. **더 가벼운 모델 사용**:
   - `gemma:2b` 또는 `qwen2.5:1.5b`
   
2. **토큰 수 제한**:
   - max_tokens: 200 이하

3. **컨텍스트 단순화**:
   - 짧은 시스템 프롬프트

### B. GPU 메모리 부족시
1. **모델 양자화**:
   - Q4_K_M 버전 사용
   
2. **GPU Layers 조정**:
   - 자동에서 수동으로 변경 (예: 20-25)

### C. 연결 불안정시
1. **LM Studio 재시작**
2. **포트 변경**: 1234 → 1235
3. **방화벽 확인**

---

## ✅ 최적화 완료 체크리스트
- [ ] GPU 가속 활성화
- [ ] CORS 설정 완료
- [ ] 모델 재로드 완료
- [ ] 단순 테스트 5초 이내 응답
- [ ] 웹앱 연동 테스트 성공
- [ ] 연속 요청 안정성 확인