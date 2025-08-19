# 🚀 현재 컴퓨터 LM Studio 연동 체크리스트

## ✅ 설정 확인 사항

### 1. LM Studio 실행 확인
```bash
# LM Studio가 실행 중인지 확인
curl http://localhost:1234/v1/models

# 예상 응답: {"data": [{"id": "google/gemma-2-3n-e4b", ...}]}
```

### 2. 모델 로드 확인
- [ ] LM Studio에서 `google/gemma-2-3n-e4b` 모델 로드됨
- [ ] Chat 탭에서 테스트 메시지 전송 가능
- [ ] Server 탭에서 "Server Running on port 1234" 표시

### 3. 환경변수 설정 확인
```bash
# .env.local 파일 내용 확인
cat .env.local

# 다음 설정이 있어야 함:
# AI_PROVIDER=lmstudio
# LMSTUDIO_URL=http://localhost:1234/v1
# LMSTUDIO_MODEL=google/gemma-2-3n-e4b
```

### 4. 앱 연동 테스트
```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:5173 접속
# 채팅창에 테스트 메시지 입력
# 콘솔에서 "[LM Studio] Gemma-2-3n-e4b responded in XXXms" 확인
```

## 🔧 문제 해결

### LM Studio 연결 안될 때
1. **LM Studio 재시작**
   - LM Studio 완전 종료 후 재실행
   - Server 탭에서 "Start Server" 클릭

2. **포트 충돌 확인**
   ```bash
   lsof -i :1234  # 포트 사용 프로세스 확인
   ```

3. **CORS 설정 확인**
   - LM Studio > Settings > Server
   - "Enable CORS" 체크됨
   - "Allow Remote Connections" 체크됨

### 모델 응답이 이상할 때
1. **시스템 프롬프트 확인**
   - LM Studio Chat 탭에서 System Message 설정
   
2. **Temperature 조정**
   - 의료 정보는 0.3-0.5 권장
   
3. **모델 재로드**
   - Model 탭에서 모델 언로드 후 재로드

## 📊 성능 모니터링

### 응답 시간 확인
```javascript
// 브라우저 콘솔에서 실행
console.time('AI Response');
// 채팅 메시지 전송
console.timeEnd('AI Response');
// 2-5초 이내면 정상
```

### 메모리 사용량 확인
- macOS: 활성 상태 보기에서 LM Studio 메모리 확인
- Windows: 작업 관리자에서 메모리 사용량 확인
- 3-4GB 사용 중이면 정상

## ✅ 완료 체크
- [ ] LM Studio 정상 실행
- [ ] Gemma-2-3n-e4b 모델 로드
- [ ] 웹앱에서 AI 채팅 동작
- [ ] 응답 시간 5초 이내
- [ ] 의료 관련 질문 테스트 완료
- [ ] 한국어/영어 모두 테스트 완료

---

## 🎯 다음 단계: 연구실 서버 준비
이 설정이 완료되면 연구실 서버 설치 가이드를 진행합니다.