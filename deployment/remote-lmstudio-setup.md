# LM Studio 원격 서버 구축 가이드

## 🎯 옵션 1: 집에 있는 다른 컴퓨터 활용

### 필요 조건
- **GPU**: RTX 3060 이상 (6GB VRAM) 또는 M1/M2 Mac
- **RAM**: 8GB 이상 (16GB 권장)
- **네트워크**: 고정 IP 또는 DDNS

### 설정 방법

#### 1. 원격 컴퓨터에 LM Studio 설치
```bash
# Windows/Mac에서 LM Studio 다운로드
# https://lmstudio.ai

# 또는 Docker로 설치 (Linux)
docker run -it --gpus all -p 1234:1234 \
  -v ./models:/app/models \
  lmstudio/server:latest
```

#### 2. 외부 접근 허용 설정
```bash
# LM Studio 설정에서:
# - Server → Enable CORS: ✅
# - Server → Allow Remote Connections: ✅
# - Listen Address: 0.0.0.0:1234

# 방화벽 포트 개방
sudo ufw allow 1234  # Linux
# Windows: 방화벽에서 1234 포트 허용
```

#### 3. 포트포워딩 설정 (공유기)
```
외부포트: 1234 → 내부IP:1234
예: 192.168.1.100:1234
```

#### 4. DDNS 설정 (선택사항)
```bash
# 집 IP가 바뀌는 경우
# No-IP, DuckDNS 등으로 도메인 연결
# 예: your-ai-server.ddns.net:1234
```

## 🚀 옵션 2: 클라우드 서버 구축 (추천)

### A. AWS EC2 GPU 인스턴스
```bash
# g4dn.xlarge 인스턴스 (Tesla T4)
# 월 비용: ~$300-400
# 성능: Gemma-2-3B 쾌적 실행

# 설치 스크립트
#!/bin/bash
sudo apt update
sudo apt install -y docker.io nvidia-docker2

# LM Studio Server 실행
docker run -d --gpus all --name lm-studio \
  -p 1234:1234 \
  -v /home/ubuntu/models:/app/models \
  --restart unless-stopped \
  lmstudio/server:latest
```

### B. Google Cloud Platform (더 저렴)
```bash
# T4 GPU 인스턴스
# 월 비용: ~$200-300
# Preemptible 사용시 70% 할인

gcloud compute instances create ai-server \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release
```

### C. Paperspace Gradient (가장 쉬움)
```bash
# 월 $39부터 GPU 인스턴스
# LM Studio 프리설치 이미지 제공
# 1클릭 배포 가능
```

## 🏠 옵션 3: 미니PC 전용 서버 구축

### 추천 하드웨어
```
1. Intel NUC 13 Pro + RTX 4060
   - 가격: ~$1,500
   - 전력: 150W
   - 성능: Gemma-2-3B 완벽 실행

2. Mac Mini M2 Pro
   - 가격: ~$1,800
   - 전력: 20W (매우 효율적)
   - 성능: 16GB 통합메모리로 쾌적

3. 중고 워크스테이션
   - HP Z440 + RTX 3060
   - 가격: ~$800
   - 성능: 충분
```

### 24/7 운영 설정
```bash
# systemd 서비스 등록 (Linux)
sudo tee /etc/systemd/system/lm-studio.service << EOF
[Unit]
Description=LM Studio Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/docker run --gpus all -p 1234:1234 lmstudio/server
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable lm-studio
sudo systemctl start lm-studio
```

## 📊 비용 비교

| 방식 | 초기비용 | 월 운영비 | 장점 | 단점 |
|------|----------|-----------|------|------|
| 집 컴퓨터 | $0 | ~$30 (전기) | 무료, 완전 통제 | 인터넷 의존, 관리 |
| 미니PC 서버 | $800-1,800 | ~$50 | 저전력, 안정적 | 초기 투자 |
| AWS GPU | $0 | $300-400 | 확장성, 안정성 | 비쌈 |
| GCP GPU | $0 | $200-300 | AWS보다 저렴 | 복잡함 |
| Paperspace | $0 | $39-99 | 매우 쉬움 | 제한적 |

## ⚡ 최적화 팁

### 1. 모델 경량화
```python
# GGUF 양자화로 메모리 50% 절약
# Q4_K_M: 품질 유지하면서 경량화
# Q8_0: 최고 품질, 조금 무거움

# LM Studio에서 자동 다운로드
"google/gemma-2-3b-it-GGUF/gemma-2-3b-it-q4_k_m.gguf"
```

### 2. 로드밸런싱
```bash
# 여러 서버 운영시
# nginx로 로드밸런싱
upstream lm_studio {
    server 192.168.1.100:1234;
    server your-cloud-server:1234 backup;
}
```

### 3. 모니터링
```bash
# 서버 상태 체크
#!/bin/bash
while true; do
    if ! curl -f http://your-server:1234/v1/models; then
        echo "LM Studio down! Restarting..."
        docker restart lm-studio
    fi
    sleep 60
done
```