# Bookfolio 추천 시스템 단계별 계획

## 목적

서재/독서 행동 데이터 기반으로 개인화 추천 정확도를 높이고, 운영 중 학습 가능한 구조를 만든다.

## 1차 (적용 완료)

- `user_book_interactions`: 사용자-도서 상호작용 이벤트 로그
- `recommendation_impressions`: 추천 노출/순위/점수 로그
- API
  - `POST /api/me/recommendations/interactions`
  - `POST /api/me/recommendations/impressions`
  - `GET /api/me/recommendations?trackImpression=1`

## 2차 (적용 완료)

- `user_preference_profiles`: 사용자 선호 프로필 집계
- `book_feature_vectors`: 도서 피처 벡터/품질 점수 저장
- API/로직
  - `POST /api/me/recommendations` (선호 프로필 재계산)
  - `POST /api/me/recommendations/book-features` (관리자/스태프 배치 반영)
  - `buildHybridRecommendations()` 기반 하이브리드 점수 계산

## 3차 (운영 고도화 계획만 등록)

운영 데이터가 누적되면 아래 항목을 순차 적용한다.

1. 협업 필터링 계층 추가
   - 사용자-사용자/아이템-아이템 유사도 캐시 테이블 도입
   - implicit feedback 기반 잠재요인 모델(ALS/BPR 계열) 평가
2. 실험/품질 관리 체계 강화
   - 추천 버전별 온라인 지표(CTR, 저장률, 완독 전환률) 대시보드
   - 실험 버킷별 성과 비교 및 자동 롤백 기준 정의
3. 다양성/신선도 제어
   - 최근 노출 피로도 패널티
   - 카테고리 편중 완화(다양성 리랭커)
4. 콜드스타트 정교화
   - 온보딩 선호 태그 + 인기/신간 혼합 정책
   - 신규 도서 메타데이터 기반 초기 점수 자동화

## 운영 체크리스트

- 주기 배치
  - 사용자 선호 프로필 재계산(일 1회 이상)
  - 도서 피처 벡터 갱신(신규/수정 도서 중심)
- 모니터링
  - 추천 API 실패율, 응답 시간
  - 로그 적재 누락률(`interaction`, `impression`)
