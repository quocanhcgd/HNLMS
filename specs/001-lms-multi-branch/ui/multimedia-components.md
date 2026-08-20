# Multimedia Learning Components

## Authoring

- `LessonComposer`: block insertion, reorder, duplicate, delete, schema error, draft save, preview và publish readiness.
- `MediaUploader`: drag/drop, progress, pause/resume/cancel/retry, quota/MIME error và processing state.
- `QuestionEditor`: type-specific fields, media prompt, answer/scoring config, preview và approval status.
- Không cho paste/embed script hoặc iframe ngoài allowlist; mọi payload qua runtime schema.

## Student playback

- `LessonRenderer`: ordered blocks, completion evidence và resume.
- `ImageViewer`: alt/caption, zoom và gallery keyboard navigation.
- `AudioPlayer`: seek, speed, loop segment, transcript và resume.
- `VideoPlayer`: HLS/provider playback, speed, caption, chapter, fullscreen/PiP và resume.
- `SlideViewer`: PDF page/continuous view, thumbnail, page resume và download theo policy.
- `MediaProcessingStatus`: uploading, scanning, processing, ready, rejected, failed; không trình bày processing như ready.

## Assessment

- `QuestionRenderer`: registry dispatch theo type/schema version.
- `AttemptNavigator`, `AttemptTimer`, `AutosaveIndicator`, `ConnectivityStatus`, `SubmissionReview`.
- `VoiceRecorder`: microphone permission/device check, record/pause/resume, waveform, playback, re-record, upload progress và fallback.
- `TeacherGradingPanel`: rubric, score, text/timestamp feedback, publish và adjustment audit.

## Responsive and accessibility

- Player control có accessible name, keyboard operation, visible focus và touch target 44px.
- Caption/transcript có locale; image có alt hoặc explicit decorative marker.
- Mobile assessment không che prompt bằng timer/player/keyboard; question navigation dùng drawer/sheet.
- Media failure luôn có text state, retry action và correlation/reference khi cần hỗ trợ.

## Acceptance states

Mỗi component kiểm tra dark/light, vi/en, loading/empty/error/forbidden, offline/retry, long title/transcript và viewport 1440x900, 768x1024, 390x844. Voice recorder cần test microphone denied, no device, interrupted recording và upload retry.
