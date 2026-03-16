# Pixera

이미지 리사이즈 웹 애플리케이션 프론트엔드입니다.

## 프로젝트 소개
Pixera는 이미지를 업로드하고 원하는 크기, 품질, 포맷으로 변환할 수 있는 웹 프론트엔드 프로젝트입니다.
사용자는 간단한 옵션 설정으로 리사이즈 작업을 요청할 수 있으며,
앱은 백엔드 API와 연동해 업로드, 작업 생성, 진행 상태 조회까지 한 흐름으로 제공합니다.
로컬 개발 환경에서 빠르게 실행해 이미지 리사이즈 기능을 테스트할 수 있도록 구성되어 있습니다.

## 실행 방법
1. `npm install`
2. `.env.example`을 복사해 `.env` 파일 생성
   - 예시: `cp .env.example .env`
   - Windows에서는 `.env` 파일을 수동으로 생성해도 됩니다.
3. `npm run dev`

## API 설정
- 기본 주소: `http://localhost:4000/v1`
- `.env` 파일의 `VITE_API_BASE` 값으로 변경 가능

## 현재 범위
- 클라이언트 검증이 포함된 파일 업로드 UI
- 리사이즈 옵션: 너비, 높이, 품질, fit, 포맷
- 백엔드 연동 흐름:
  - `POST /uploads/presign`
  - `PUT` 요청으로 `uploadUrl`에 업로드
  - `POST /jobs`
  - `GET /jobs/:jobId` 폴링 조회
