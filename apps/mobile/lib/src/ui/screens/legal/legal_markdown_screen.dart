import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

enum LegalDocumentType { terms, privacy }

class LegalMarkdownScreen extends StatelessWidget {
  const LegalMarkdownScreen({super.key, required this.documentType});

  final LegalDocumentType documentType;

  static Route<void> termsRoute() {
    return MaterialPageRoute(
      builder: (_) =>
          const LegalMarkdownScreen(documentType: LegalDocumentType.terms),
    );
  }

  static Route<void> privacyRoute() {
    return MaterialPageRoute(
      builder: (_) =>
          const LegalMarkdownScreen(documentType: LegalDocumentType.privacy),
    );
  }

  String get _assetPath {
    switch (documentType) {
      case LegalDocumentType.terms:
        return 'assets/legal/terms_of_service.md';
      case LegalDocumentType.privacy:
        return 'assets/legal/privacy_policy.md';
    }
  }

  String get _appBarTitle {
    switch (documentType) {
      case LegalDocumentType.terms:
        return '서비스 약관';
      case LegalDocumentType.privacy:
        return '개인정보처리방침';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BookfolioDesignTokens.surface,
      appBar: AppBar(
        title: Text(_appBarTitle),
      ),
      body: FutureBuilder<String>(
        future: rootBundle.loadString(_assetPath),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('문서를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'),
              ),
            );
          }
          final markdown = snapshot.data ?? '';
          return Markdown(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
            data: markdown,
            onTapLink: (text, href, title) async {
              if (href == null || href.isEmpty) return;
              if (!context.mounted) return;
              if (href.startsWith('bfapp://')) {
                final host = Uri.parse(href).host;
                if (host == 'privacy') {
                  Navigator.of(context).push<void>(privacyRoute());
                } else if (host == 'terms') {
                  Navigator.of(context).push<void>(termsRoute());
                }
                return;
              }
              final uri = Uri.tryParse(href);
              if (uri == null) return;
              final launched = await launchUrl(
                uri,
                mode: LaunchMode.externalApplication,
              );
              if (!launched && context.mounted) {
                ScaffoldMessenger.maybeOf(context)?.showSnackBar(
                  const SnackBar(content: Text('링크를 열 수 없습니다.')),
                );
              }
            },
          );
        },
      ),
    );
  }
}
