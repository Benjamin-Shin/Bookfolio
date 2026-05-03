import 'package:seogadam_mobile/src/services/bookfolio_client_error_reporter.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/connectivity_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/state/shared_library_invite_controller.dart';
import 'package:seogadam_mobile/src/state/theme_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_themes.dart';
import 'package:seogadam_mobile/src/ui/app_root_scaffold.dart';
import 'package:seogadam_mobile/src/ui/screens/auth/auth_gate.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 루트 위젯: 테마·인증·서가 상태를 제공한다.
///
/// History:
/// - 2026-05-03: `_ClientErrorReporterBinding` — `AuthController`를 오류 보고기에 연결
/// - 2026-05-03: `debugShowCheckedModeBanner: false` — 스크린샷용 DEBUG 띠 비표시
/// - 2026-04-06: `ConnectivityController` — 루트 네트워크 가드
/// - 2026-04-05: `MaterialApp.title` 사용자 노출명을 서가담으로 정렬
/// - 2026-04-12: `BookfolioThemes.light()`/`dark()` — `#Reference/DESIGN.md` 단일 테마
/// - 2026-03-28: `ThemeController` 연동(`theme`/`darkTheme`/`themeMode`/팔레트)
class BookfolioApp extends StatelessWidget {
  const BookfolioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeController()..restore()),
        ChangeNotifierProvider(create: (_) => ConnectivityController()),
        ChangeNotifierProvider(
            create: (_) => AuthController()..restoreSession()),
        ChangeNotifierProxyProvider<AuthController, LibraryController>(
          create: (_) => LibraryController(),
          update: (_, auth, library) =>
              (library ?? LibraryController())..attach(auth),
        ),
        ChangeNotifierProxyProvider<AuthController,
            SharedLibraryInviteController>(
          create: (_) => SharedLibraryInviteController(),
          update: (_, auth, prev) =>
              (prev ?? SharedLibraryInviteController())..attach(auth),
        ),
      ],
      child: _ClientErrorReporterBinding(
        child: Consumer<ThemeController>(
          builder: (context, theme, _) {
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              navigatorKey: bookfolioRootNavigatorKey,
              scaffoldMessengerKey: bookfolioRootScaffoldMessengerKey,
              title: '서가담',
              theme: BookfolioThemes.light(),
              darkTheme: BookfolioThemes.dark(),
              themeMode: theme.themeMode,
              home: const AuthGate(),
            );
          },
        ),
      ),
    );
  }
}

/// [BookfolioClientErrorReporter]에 [AuthController]를 연결해 로그인 시 Bearer가 붙도록 합니다.
///
/// History:
/// - 2026-05-03: 신규
class _ClientErrorReporterBinding extends StatefulWidget {
  const _ClientErrorReporterBinding({required this.child});

  final Widget child;

  @override
  State<_ClientErrorReporterBinding> createState() =>
      _ClientErrorReporterBindingState();
}

class _ClientErrorReporterBindingState extends State<_ClientErrorReporterBinding> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    BookfolioClientErrorReporter.instance
        .attachAuth(context.read<AuthController>());
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
