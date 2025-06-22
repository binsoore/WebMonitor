# CloudFlare Pages 배포 및 설정 가이드

## 1. KV Namespace 생성
1. CloudFlare 대시보드 접속
2. Workers & Pages > KV 메뉴
3. "Create namespace" 클릭
4. 이름: `URL_MONITOR_KV` 입력
5. "Add" 클릭하여 생성
6. Namespace ID 기록 (나중에 필요)

## 2. GitHub 연동 배포
1. GitHub에 프로젝트 코드 푸시
2. CloudFlare Pages 대시보드
3. "Create a project" > "Connect to Git"
4. GitHub 저장소 선택
5. 빌드 설정:
   - **Framework preset**: None
   - **Build command**: `npm install && npx vite build --config vite.config.cloudflare.ts`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

## 3. KV 바인딩 설정
배포 완료 후:
1. Pages 프로젝트 > Settings > Functions
2. "KV namespace bindings" 섹션
3. "Add binding" 클릭:
   - **Variable name**: `URL_MONITOR_KV`
   - **KV namespace**: 1단계에서 생성한 namespace 선택
4. "Save" 클릭

## 4. 환경변수 설정
1. Settings > Environment variables
2. Production 탭에서 추가:
   - **Variable name**: `GMAIL_APP_PASSWORD`
   - **Value**: Gmail 앱 비밀번호 입력
3. Preview 탭에서도 동일하게 설정
4. "Save" 클릭

## 5. 재배포
설정 변경 후 반드시 재배포:
1. Deployments 탭
2. "Retry deployment" 또는 새로운 배포 트리거

## 주의사항
- KV 바인딩과 환경변수 설정 후 반드시 재배포 필요
- Gmail 앱 비밀번호는 2단계 인증 활성화된 계정에서만 생성 가능
- 배포 시 Node.js 20 버전 사용 확인

## 테스트
배포 완료 후:
1. 배포된 URL 접속
2. Settings 메뉴에서 이메일 설정 저장 테스트
3. URL 추가 및 모니터링 기능 확인