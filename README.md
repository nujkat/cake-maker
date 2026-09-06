# 케익 만들기 게임

주문서대로 케익을 만들어 별점과 돈을 받고, 그 돈으로 새 재료를 해금하는 브라우저 게임.

## 실행

ES 모듈을 쓰기 때문에 `file://` 로는 열리지 않는다. 로컬 서버가 필요하다.

    python -m http.server 8000

브라우저에서 http://localhost:8000 을 연다.

## 테스트

    npm test

## 문서

- 설계 `docs/superpowers/specs/2026-09-06-cake-maker-design.md`
- 구현 계획 `docs/superpowers/plans/2026-09-06-cake-maker.md`
- 진행 상황 `checklist.md`
- 결정 기록 `context-notes.md`
