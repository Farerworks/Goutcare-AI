// 원격 LM Studio 서버 관리
export class RemoteLMStudioManager {
  private servers: string[];
  private currentServerIndex: number = 0;
  private healthCheckInterval?: NodeJS.Timeout;
  
  constructor(servers: string[]) {
    // 여러 서버 설정 가능
    this.servers = servers; // ['http://home-pc:1234', 'http://cloud-server:1234']
    this.startHealthCheck();
  }
  
  // 사용 가능한 서버 자동 선택
  async getAvailableServer(): Promise<string> {
    // 현재 서버부터 체크
    for (let i = 0; i < this.servers.length; i++) {
      const serverIndex = (this.currentServerIndex + i) % this.servers.length;
      const server = this.servers[serverIndex];
      
      if (await this.checkServerHealth(server)) {
        this.currentServerIndex = serverIndex;
        return server;
      }
    }
    
    throw new Error('No LM Studio servers available');
  }
  
  private async checkServerHealth(serverUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/v1/models`, {
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // 주기적 헬스체크
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      const statuses = await Promise.all(
        this.servers.map(async (server, index) => ({
          index,
          server,
          healthy: await this.checkServerHealth(server)
        }))
      );
      
      console.log('LM Studio Servers Status:', statuses);
      
      // 모든 서버가 다운이면 알림
      if (statuses.every(s => !s.healthy)) {
        console.error('🚨 All LM Studio servers are down!');
        // 여기서 Slack/Discord 알림 등 추가 가능
      }
    }, 30000); // 30초마다 체크
  }
  
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// 환경별 서버 설정
export function createLMStudioManager(): RemoteLMStudioManager {
  const servers: string[] = [];
  
  // 로컬 개발
  if (process.env.NODE_ENV === 'development') {
    servers.push('http://localhost:1234/v1');
  }
  
  // 집 서버
  if (process.env.HOME_LMSTUDIO_URL) {
    servers.push(process.env.HOME_LMSTUDIO_URL);
  }
  
  // 클라우드 서버
  if (process.env.CLOUD_LMSTUDIO_URL) {
    servers.push(process.env.CLOUD_LMSTUDIO_URL);
  }
  
  if (servers.length === 0) {
    throw new Error('No LM Studio servers configured');
  }
  
  return new RemoteLMStudioManager(servers);
}