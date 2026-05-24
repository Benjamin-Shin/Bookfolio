import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:seogadam_mobile/src/ui/layout/mobile_scroll_padding.dart';
import 'package:url_launcher/url_launcher.dart';

enum LegalDocumentType { terms, privacy }

/// 약관·개인정보처리방침 — 에셋 마크다운 표시.
///
/// History:
/// - 2026-05-23: `embeddedInShell`·`bookfolioLegalMarkdownPadding` — 드로어(쉘) 진입 시 하단 탭 가림 보정
class LegalMarkdownScreen extends StatelessWidget {
  const LegalMarkdownScreen({
    super.key,
    required this.documentType,
    this.embeddedInShell = false,
  });

  final LegalDocumentType documentType;
  final bool embeddedInShell;

  static Route<void> termsRoute({bool embeddedInShell = false}) {
    return MaterialPageRoute(
      builder: (_) => LegalMarkdownScreen(
        documentType: LegalDocumentType.terms,
        embeddedInShell: embeddedInShell,
      ),
    );
  }

  static Route<void> privacyRoute({bool embeddedInShell = false}) {
    return MaterialPageRoute(
      builder: (_) => LegalMarkdownScreen(
        documentType: LegalDocumentType.privacy,
        embeddedInShell: embeddedInShell,
      ),
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
            padding: bookfolioLegalMarkdownPadding(
              context,
              embeddedInShell: embeddedInShell,
            ),
            data: markdown,
            onTapLink: (text, href, title) async {
              if (href == null || href.isEmpty) return;
              if (!context.mounted) return;
              if (href.startsWith('bfapp://')) {
                final host = Uri.parse(href).host;
                if (host == 'privacy') {
                  Navigator.of(context).push<void>(
                    privacyRoute(embeddedInShell: embeddedInShell),
                  );
                } else if (host == 'terms') {
                  Navigator.of(context).push<void>(
                    termsRoute(embeddedInShell: embeddedInShell),
                  );
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
