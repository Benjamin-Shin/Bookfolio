import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/state/shared_library_invite_controller.dart';
import 'package:bookfolio_mobile/src/state/theme_controller.dart';
import 'package:bookfolio_mobile/src/theme/bookfolio_themes.dart';
import 'package:bookfolio_mobile/src/ui/app_root_scaffold.dart';
import 'package:bookfolio_mobile/src/ui/screens/auth_gate.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 루트 위젯: 테마·인증·서재 상태를 제공한다.
///
/// History:
/// - 2026-03-28: `ThemeController` 연동(`theme`/`darkTheme`/`themeMode`/팔레트)
class BookfolioApp extends StatelessWidget {
  const BookfolioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeController()..restore()),
        ChangeNotifierProvider(create: (_) => AuthController()..restoreSession()),
        ChangeNotifierProxyProvider<AuthController, LibraryController>(
          create: (_) => LibraryController(),
          update: (_, auth, library) => (library ?? LibraryController())..attach(auth),
        ),
        ChangeNotifierProxyProvider<AuthController, SharedLibraryInviteController>(
          create: (_) => SharedLibraryInviteController(),
          update: (_, auth, prev) => (prev ?? SharedLibraryInviteController())..attach(auth),
        ),
      ],
      child: Consumer<ThemeController>(
        builder: (context, theme, _) {
          return MaterialApp(
            navigatorKey: bookfolioRootNavigatorKey,
            scaffoldMessengerKey: bookfolioRootScaffoldMessengerKey,
            title: 'Bookfolio',
            theme: BookfolioThemes.light(theme.palette),
            darkTheme: BookfolioThemes.dark(theme.palette),
            themeMode: theme.themeMode,
            home: const AuthGate(),
          );
        },
      ),
    );
  }
}

