import 'dart:io';

import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

/// @nodoc — [quote_ocr.dart]에서만 사용
Future<String> recognizeQuoteTextFromImageFileImpl(String path) async {
  final file = File(path);
  if (!await file.exists()) return '';

  final input = InputImage.fromFilePath(path);
  final recognizer = TextRecognizer(script: TextRecognitionScript.korean);
  try {
    final result = await recognizer.processImage(input);
    return result.text.trim();
  } finally {
    await recognizer.close();
  }
}
