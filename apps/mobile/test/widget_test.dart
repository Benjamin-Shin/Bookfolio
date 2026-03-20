import 'package:bookfolio_mobile/src/app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('BookfolioApp builds', (WidgetTester tester) async {
    await tester.pumpWidget(const BookfolioApp());
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
