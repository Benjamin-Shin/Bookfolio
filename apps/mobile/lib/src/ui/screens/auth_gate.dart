import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:bookfolio_mobile/src/ui/screens/library_screen.dart';
import 'package:bookfolio_mobile/src/ui/screens/sign_in_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthController>(
      builder: (context, auth, _) {
        if (auth.isAuthenticated) {
          return const LibraryScreen();
        }
        return const SignInScreen();
      },
    );
  }
}

