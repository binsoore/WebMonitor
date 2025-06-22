# CloudFlare Pages 문제 해결 가이드

## Settings 저장 오류 문제 해결

### 1. KV Namespace 확인
CloudFlare 대시보드에서:
- Workers & Pages > KV에서 `URL_MONITOR_KV` namespace 존재 확인
- Pages 프로젝트 > Settings > Functions에서 KV binding 확인
- Variable name이 정확히 `URL_MONITOR_KV`인지 확인

### 2. Functions 로그 확인
CloudFlare Pages에서:
1. Deployments 탭에서 최신 배포 클릭
2. Functions 탭에서 실시간 로그 확인
3. API 호출 시 오류 메시지 확인

### 3. 일반적인 오류 및 해결방법

#### 오류: "URL_MONITOR_KV is not defined"
**원인**: KV binding이 설정되지 않음
**해결**: Settings > Functions에서 KV namespace binding 추가

#### 오류: "Cannot read property of undefined"
**원인**: 환경변수 또는 KV binding 누락
**해결**: 
1. KV binding 재확인
2. 배포 후 설정 변경사항 반영을 위해 재배포

#### 오류: "fetch failed" 또는 Network Error
**원인**: API 경로 또는 CORS 문제
**해결**:
1. API 경로가 `/api/email-settings`로 정확한지 확인
2. Functions가 올바르게 라우팅되는지 확인

### 4. 디버깅 단계
1. **브라우저 개발자 도구**: Network 탭에서 API 요청/응답 확인
2. **CloudFlare 로그**: Functions 실시간 로그 모니터링
3. **KV 저장소 확인**: CloudFlare 대시보드에서 KV 데이터 직접 확인

### 5. 강제 재배포
설정 변경 후:
1. Deployments > Retry deployment
2. 또는 GitHub에 더미 커밋 후 자동 배포

### 6. 로컬 테스트
로컬에서 CloudFlare 환경 테스트:
```bash
npm run build:cf
npx wrangler pages dev dist --kv URL_MONITOR_KV
```

## 성공 확인 방법
1. Settings 메뉴에서 이메일 정보 입력 후 저장
2. 페이지 새로고침 후 설정이 유지되는지 확인
3. CloudFlare KV 대시보드에서 `email-settings` 키 데이터 확인