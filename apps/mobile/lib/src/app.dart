import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/auth_gate.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class BookfolioApp extends StatelessWidget {
  const BookfolioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()..restoreSession()),
        ChangeNotifierProxyProvider<AuthController, LibraryController>(
          create: (_) => LibraryController(),
          update: (_, auth, library) => (library ?? LibraryController())..attach(auth),
        ),
      ],
      child: MaterialApp(
        title: 'Bookfolio',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFFB3582F),
            brightness: Brightness.light,
          ),
          scaffoldBackgroundColor: const Color(0xFFF7F0E7),
          useMaterial3: true,
        ),
        home: const AuthGate(),
      ),
    );
  }
}

