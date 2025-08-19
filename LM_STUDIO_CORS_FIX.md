# 🚨 LM Studio CORS 설정 가이드

## 문제
브라우저에서 "Failed to fetch" 에러 → CORS 정책으로 인한 차단

## 해결책

### 1. LM Studio에서 CORS 활성화
1. **LM Studio 앱 열기**
2. **Server 탭 클릭**
3. **Settings (톱니바퀴) 아이콘 클릭**
4. **다음 옵션들 체크**:
   - ✅ **Enable CORS**
   - ✅ **Allow remote connections** 
   - ✅ **Enable API key** (선택사항)

### 2. 서버 재시작
1. **Stop Server** 클릭
2. **Start Server** 클릭
3. **확인**: "Server Running on port 1234" 메시지

### 3. 테스트
```bash
# 터미널에서 CORS 헤더 확인
curl -I http://localhost:1234/v1/models
# 응답에 다음이 포함되어야 함:
# Access-Control-Allow-Origin: *
```

## 예상 결과
- ✅ 웹앱에서 채팅 정상 작동
- ✅ 통풍 예보 정상 표시
- ✅ 콘솔에서 "[LM Studio] Response received" 로그 확인