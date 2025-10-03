# Tasks: Raise Hand + Queue System

**Input**: Design documents from `/specs/003-build-a-raise/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `app/`, `lib/`, `tests/` at repository root
- Paths based on Next.js structure from plan.md

## Phase 3.1: Setup
- [ ] T001 Create queue API directory structure in app/api/queue/[classroomId]/
- [ ] T002 Create queue component directory structure in app/components/
- [ ] T003 Create queue library files in lib/ (queue-types.ts, queue-utils.ts, queue-state.ts)
- [ ] T004 [P] Configure TypeScript types for queue system
- [ ] T005 [P] Configure queue state management with Daily.co integration

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Contract test POST /api/queue/{classroomId}/raise-hand in tests/contract/test_queue_raise_hand.test.ts
- [ ] T007 [P] Contract test POST /api/queue/{classroomId}/lower-hand in tests/contract/test_queue_lower_hand.test.ts
- [ ] T008 [P] Contract test POST /api/queue/{classroomId}/call-on in tests/contract/test_queue_call_on.test.ts
- [ ] T009 [P] Contract test POST /api/queue/{classroomId}/lower-individual in tests/contract/test_queue_lower_individual.test.ts
- [ ] T010 [P] Contract test POST /api/queue/{classroomId}/lower-all in tests/contract/test_queue_lower_all.test.ts
- [ ] T011 [P] Contract test GET /api/queue/{classroomId}/status in tests/contract/test_queue_status.test.ts
- [ ] T012 [P] Integration test participant raises hand flow in tests/integration/test_queue_raise_hand.test.ts
- [ ] T013 [P] Integration test instructor calls on participant flow in tests/integration/test_queue_call_on.test.ts
- [ ] T014 [P] Integration test participant leaves during queue flow in tests/integration/test_queue_participant_leaves.test.ts
- [ ] T015 [P] Integration test queue at capacity flow in tests/integration/test_queue_capacity.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T016 [P] QueueEntry type definition in lib/queue-types.ts
- [ ] T017 [P] QueueState type definition in lib/queue-types.ts
- [ ] T018 [P] ActiveSpeaker type definition in lib/queue-types.ts
- [ ] T019 [P] Queue utility functions in lib/queue-utils.ts
- [ ] T020 [P] Queue state management in lib/queue-state.ts
- [ ] T021 [P] RaiseHandButton component in app/components/RaiseHandButton.tsx
- [ ] T022 [P] QueuePanel component in app/components/QueuePanel.tsx
- [ ] T023 [P] QueueStatus component in app/components/QueueStatus.tsx
- [ ] T024 POST /api/queue/{classroomId}/raise-hand endpoint
- [ ] T025 POST /api/queue/{classroomId}/lower-hand endpoint
- [ ] T026 POST /api/queue/{classroomId}/call-on endpoint
- [ ] T027 POST /api/queue/{classroomId}/lower-individual endpoint
- [ ] T028 POST /api/queue/{classroomId}/lower-all endpoint
- [ ] T029 GET /api/queue/{classroomId}/status endpoint

## Phase 3.4: Integration
- [ ] T030 Integrate RaiseHandButton into Classroom component
- [ ] T031 Integrate QueuePanel into InstructorControls component
- [ ] T032 Integrate QueueStatus into ParticipantList component
- [ ] T033 Connect queue state to Daily.co participant events
- [ ] T034 Implement real-time queue updates via Daily.co WebSocket
- [ ] T035 Add queue state persistence across page refreshes
- [ ] T036 Implement automatic cleanup on participant departure
- [ ] T037 Add queue capacity enforcement and error handling

## Phase 3.5: Polish
- [ ] T038 [P] Unit tests for QueueEntry validation in tests/unit/lib/queue-utils.test.ts
- [ ] T039 [P] Unit tests for QueueState management in tests/unit/lib/queue-state.test.ts
- [ ] T040 [P] Unit tests for RaiseHandButton component in tests/unit/components/RaiseHandButton.test.tsx
- [ ] T041 [P] Unit tests for QueuePanel component in tests/unit/components/QueuePanel.test.tsx
- [ ] T042 [P] Unit tests for QueueStatus component in tests/unit/components/QueueStatus.test.tsx
- [ ] T043 Performance tests for real-time updates (<200ms)
- [ ] T044 Accessibility tests for keyboard navigation and screen readers
- [ ] T045 [P] Update API documentation in contracts/queue-api.yaml
- [ ] T046 Remove code duplication and optimize performance
- [ ] T047 Run manual testing scenarios from quickstart.md

## Dependencies
- Tests (T006-T015) before implementation (T016-T029)
- T016-T018 (types) before T019-T020 (utilities and state)
- T019-T020 (utilities and state) before T021-T023 (components)
- T021-T023 (components) before T030-T032 (integration)
- T033-T037 (Daily.co integration) before T038-T047 (polish)
- Implementation before polish (T038-T047)

## Parallel Example
```
# Launch T006-T015 together (all contract and integration tests):
Task: "Contract test POST /api/queue/{classroomId}/raise-hand in tests/contract/test_queue_raise_hand.test.ts"
Task: "Contract test POST /api/queue/{classroomId}/lower-hand in tests/contract/test_queue_lower_hand.test.ts"
Task: "Contract test POST /api/queue/{classroomId}/call-on in tests/contract/test_queue_call_on.test.ts"
Task: "Contract test POST /api/queue/{classroomId}/lower-individual in tests/contract/test_queue_lower_individual.test.ts"
Task: "Contract test POST /api/queue/{classroomId}/lower-all in tests/contract/test_queue_lower_all.test.ts"
Task: "Contract test GET /api/queue/{classroomId}/status in tests/contract/test_queue_status.test.ts"
Task: "Integration test participant raises hand flow in tests/integration/test_queue_raise_hand.test.ts"
Task: "Integration test instructor calls on participant flow in tests/integration/test_queue_call_on.test.ts"
Task: "Integration test participant leaves during queue flow in tests/integration/test_queue_participant_leaves.test.ts"
Task: "Integration test queue at capacity flow in tests/integration/test_queue_capacity.test.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- All queue operations must be real-time and session-scoped
- Integrate with existing Daily.co participant management
- Maintain accessibility compliance (WCAG 2.1 AA)

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
