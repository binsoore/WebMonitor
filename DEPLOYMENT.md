# CloudFlare Pages 배포 가이드

## 빠른 배포 단계

### 1. KV Namespace 생성
```bash
# CloudFlare 대시보드에서:
# Workers & Pages > KV > Create namespace
# 이름: URL_MONITOR_KV
# Namespace ID 복사
```

### 2. GitHub 배포 (권장)
1. 코드를 GitHub 저장소에 푸시
2. CloudFlare Pages에서 "Create a project" 클릭
3. GitHub 저장소 연결
4. 빌드 설정:
   - **Framework preset**: None
   - **Build command**: `npm install && npx vite build --config vite.config.cloudflare.ts`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (기본값)

### 3. Functions 바인딩 설정
배포 후 CloudFlare Pages 대시보드에서:
1. Settings > Functions 탭
2. "KV namespace bindings" 섹션
3. "Add binding" 클릭:
   - **Variable name**: `URL_MONITOR_KV`
   - **KV namespace**: 1단계에서 생성한 namespace 선택

### 4. 환경변수 설정
Settings > Environment variables에서:
1. Production 탭에서 환경변수 추가:
   - **GMAIL_APP_PASSWORD**: Gmail 앱 비밀번호
2. Preview 탭에서도 동일하게 설정
3. 변경사항 저장

### 4. 배포 완료
- 자동으로 빌드되고 배포됩니다
- 제공된 URL로 접속하여 테스트

## 로컬 테스트
```bash
npm install
npx vite build --config vite.config.cloudflare.ts
```

## 문제 해결
- **빌드 실패**: Node.js 버전을 20으로 설정
- **KV 오류**: Functions 설정에서 바인딩 확인
- **API 오류**: Functions 로그 확인