# URL Monitor - CloudFlare Pages 배포 가이드

URL 모니터링 웹사이트를 CloudFlare Pages에 배포하는 방법입니다.

## 기능
- 웹사이트 URL 모니터링 (5분~1일 간격)
- 실시간 상태 확인 (온라인/오프라인)
- 이메일 알림 시스템 (다운타임/복구)
- 응답 시간 및 가동률 추적
- 오류 로그 및 통계 대시보드

## CloudFlare Pages 배포 단계

### 1. CloudFlare 계정 설정
1. [CloudFlare](https://cloudflare.com)에 가입/로그인
2. "Pages" 섹션으로 이동
3. "Create a project" 클릭

### 2. KV Namespace 생성
1. CloudFlare 대시보드에서 "Workers & Pages" > "KV" 이동
2. "Create namespace" 클릭
3. 이름: `URL_MONITOR_KV` 입력
4. Namespace ID 복사해두기

### 3. 프로젝트 빌드 및 배포

#### 로컬에서 빌드 테스트:
```bash
npm install
node build-simple.js
```

#### CloudFlare Pages에 배포:

**방법 1: GitHub 연동 (권장)**
1. GitHub에 코드 푸시
2. CloudFlare Pages에서 GitHub 저장소 연결
3. 빌드 설정:
   - Build command: `node build-simple.js`
   - Build output directory: `dist`
   - Root directory: `/`
   - Environment variables: `URL_MONITOR_KV` (KV Namespace 바인딩 필요)

**방법 2: 직접 업로드**
```bash
node build-simple.js
npx wrangler pages deploy dist
```

### 4. CloudFlare Pages 환경변수 설정

#### KV Namespace 바인딩:
1. CloudFlare Pages 대시보드 → Settings → Functions
2. "Add binding" 클릭
3. Variable name: `URL_MONITOR_KV`
4. Type: `KV Namespace`
5. KV namespace: 앞서 생성한 namespace 선택

#### Environment Variables:
- `NODE_ENV`: `production`

### 5. 이메일 설정 (선택사항)
이메일 알림을 위해서는 다음 중 하나 선택:
- CloudFlare Email Workers 사용
- 외부 이메일 서비스 API 연동 (SendGrid, Mailgun 등)

## 로컬 개발

```bash
# 개발 서버 시작
npm run dev

# CloudFlare 로컬 환경에서 테스트
npm run cf:dev
```

## 프로젝트 구조

```
├── client/               # React 프론트엔드
├── server/              # Express 백엔드 (개발용)
├── functions/           # CloudFlare Pages Functions
├── shared/              # 공통 타입 정의
├── wrangler.toml        # CloudFlare 설정
└── _routes.json         # 라우팅 설정
```

## API 엔드포인트

- `GET /api/urls` - 모니터링 URL 목록
- `POST /api/urls` - URL 추가
- `POST /api/urls/:id/check` - 수동 체크
- `DELETE /api/urls/:id` - URL 삭제
- `GET /api/stats` - 대시보드 통계
- `GET /api/errors` - 오류 로그
- `GET/POST /api/email-settings` - 이메일 설정

## 배포 후 확인사항

1. **사이트 접속**: CloudFlare Pages에서 제공하는 URL로 접속
2. **API 테스트**: `/api/stats` 엔드포인트 확인 
3. **KV 저장소**: URL 추가 후 데이터 저장 확인
4. **모니터링**: URL 상태 체크 기능 확인

### 주요 CloudFlare Pages 설정
- **Build command**: `node build-simple.js`
- **Build output directory**: `dist`  
- **Functions compatibility date**: `2024-06-22`
- **KV Binding**: `URL_MONITOR_KV` → KV Namespace

## 문제 해결

- **KV 오류**: Namespace 바인딩이 올바른지 확인
- **빌드 실패**: 의존성 설치 상태 확인
- **API 오류**: CloudFlare Functions 로그 확인

## 추가 기능

향후 추가 가능한 기능:
- Cron Triggers를 통한 자동 모니터링
- CloudFlare Analytics 연동
- 알림 채널 확장 (Slack, Discord 등)