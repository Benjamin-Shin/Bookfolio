import 'quote_ocr_impl.dart'
    if (dart.library.html) 'quote_ocr_stub.dart';

/// 인용·메모용: 이미지 파일 경로에서 OCR 텍스트를 추출합니다 (Android / iOS).
///
/// History:
/// - 2026-03-26: 초기 — 조건부 import로 웹 빌드 호환
Future<String> recognizeQuoteTextFromImageFile(String path) =>
    recognizeQuoteTextFromImageFileImpl(path);
