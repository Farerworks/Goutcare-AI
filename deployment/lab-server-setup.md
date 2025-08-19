# 🏢 연구실 서버 LM Studio 설치 가이드

## 📋 사전 준비 사항

### 서버 스펙 확인
```bash
# GPU 확인
nvidia-smi
# 또는 Mac의 경우
system_profiler SPDisplaysDataType

# RAM 확인  
free -h  # Linux
# 또는 Mac의 경우
sysctl hw.memsize

# 디스크 공간 확인 (최소 10GB 필요)
df -h
```

### 필요 최소 사양
- **GPU**: RTX 3060 (6GB) 이상 또는 M1/M2 Mac
- **RAM**: 8GB 이상 (16GB 권장)
- **Storage**: 10GB 여유 공간
- **Network**: 안정적인 인터넷 연결

## 🚀 설치 방법

### Option A: GUI 버전 (추천)

#### Windows/Mac 서버
```bash
# 1. LM Studio 다운로드
# https://lmstudio.ai

# 2. 설치 후 실행

# 3. 모델 다운로드
# Search에서 "google/gemma-2-3b-it-GGUF" 검색
# "gemma-2-3b-it-q4_k_m.gguf" 다운로드 (약 2GB)

# 4. 서버 설정
# Server 탭 이동
# Model: google/gemma-2-3b-it-q4_k_m.gguf 선택
# Enable CORS: ✅
# Allow Remote Connections: ✅
# Port: 1234 (기본값)
# Start Server 클릭
```

### Option B: Docker 버전 (Linux 서버)

#### Ubuntu/CentOS
```bash
# 1. Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. NVIDIA Docker 설치 (GPU 사용시)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# 3. LM Studio 컨테이너 실행
docker run -d \
  --name lm-studio-server \
  --gpus all \
  -p 1234:1234 \
  -v ~/lm-studio-models:/app/models \
  --restart unless-stopped \
  lmstudio/server:latest

# 4. 모델 다운로드
docker exec -it lm-studio-server bash
# 컨테이너 내에서 모델 다운로드 스크립트 실행
```

### Option C: 수동 설치 (고급)

#### Python 환경 구축
```bash
# 1. Conda 환경 생성
conda create -n lmstudio python=3.10
conda activate lmstudio

# 2. 필요 패키지 설치
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers accelerate bitsandbytes
pip install fastapi uvicorn

# 3. 서버 스크립트 작성 (별도 파일 생성)
```

## 🌐 네트워크 설정

### 방화벽 설정
```bash
# Ubuntu/Debian
sudo ufw allow 1234

# CentOS/RHEL
sudo firewall-cmd --add-port=1234/tcp --permanent
sudo firewall-cmd --reload

# Windows
# Windows Defender 방화벽에서 1234 포트 열기
```

### 고정 IP 설정 (선택사항)
```bash
# 연구실 내부 고정 IP 설정
# 예: 192.168.1.100

# Ubuntu netplan 설정
sudo nano /etc/netplan/01-network-manager-all.yaml

# 내용:
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

sudo netplan apply
```

## 🔧 원격 접근 설정

### SSH 터널링 (보안 강화)
```bash
# 로컬 컴퓨터에서 연구실 서버로 SSH 터널
ssh -L 1234:localhost:1234 username@lab-server-ip

# 그러면 localhost:1234로 접근 가능
```

### VPN 설정 (권장)
```bash
# 연구실 VPN 통해서만 접근
# 보안성 ↑, 설정 복잡도 ↑
```

### 직접 접근 (간단함)
```bash
# .env.local 수정
LMSTUDIO_URL=http://LAB-SERVER-IP:1234/v1

# 예시
LMSTUDIO_URL=http://192.168.1.100:1234/v1
```

## 📊 성능 최적화

### GPU 메모리 최적화
```bash
# LM Studio 설정에서
# GPU Layers: 자동 또는 20-30 (RTX 3060 기준)
# Context Length: 2048 (기본값)
# Batch Size: 4-8
```

### 시스템 최적화
```bash
# Linux 스왑 비활성화 (성능 향상)
sudo swapoff -a

# GPU 성능 모드 설정
sudo nvidia-smi -pm 1
sudo nvidia-smi -pl 300  # 전력 제한 300W
```

## 🔍 모니터링 설정

### 서버 상태 모니터링
```bash
# 시스템 리소스 모니터링
htop
nvidia-smi -l 1  # GPU 상태 실시간 확인

# LM Studio 프로세스 확인
ps aux | grep lmstudio
netstat -tlnp | grep 1234
```

### 자동 재시작 스크립트
```bash
#!/bin/bash
# restart-lmstudio.sh

while true; do
    if ! curl -f http://localhost:1234/v1/models > /dev/null 2>&1; then
        echo "LM Studio가 응답하지 않습니다. 재시작합니다..."
        # Docker 재시작
        docker restart lm-studio-server
        # 또는 서비스 재시작
        # systemctl restart lmstudio
        
        sleep 30
    fi
    sleep 60
done
```

### systemd 서비스 등록 (자동 시작)
```bash
# /etc/systemd/system/lmstudio.service
[Unit]
Description=LM Studio Server
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/home/username
ExecStart=/usr/bin/docker start -a lm-studio-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 서비스 등록 및 시작
sudo systemctl enable lmstudio
sudo systemctl start lmstudio
```

## ✅ 설치 완료 체크리스트

- [ ] 서버 스펙 확인 완료
- [ ] LM Studio 설치 완료
- [ ] Gemma-2-3b 모델 다운로드 완료
- [ ] 서버 실행 및 포트 1234 오픈
- [ ] 방화벽 설정 완료
- [ ] 원격 접근 테스트 완료
- [ ] 성능 최적화 설정 완료
- [ ] 모니터링 도구 설정 완료
- [ ] 자동 재시작 스크립트 설정 완료

## 🔄 웹앱 연결

### 환경변수 업데이트
```bash
# .env.local 수정
AI_PROVIDER=lmstudio
LMSTUDIO_URL=http://LAB-SERVER-IP:1234/v1
LMSTUDIO_MODEL=google/gemma-2-3b-it-q4_k_m

# 폴백 설정 유지
FALLBACK_AI_PROVIDER=openai
```

### 연결 테스트
```bash
# 웹앱에서 채팅 테스트
# 콘솔에서 응답 시간 확인
# 1-3초 이내면 정상
```

---

## 🎉 완료!
연구실 서버 설정이 완료되면 24/7 안정적인 AI 서비스 운영이 가능합니다.