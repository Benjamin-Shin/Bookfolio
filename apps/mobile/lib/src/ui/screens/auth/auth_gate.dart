import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/ui/screens/auth/login_screen.dart';
import 'package:seogadam_mobile/src/ui/layout/main_shell_v2_screen.dart';
import 'package:seogadam_mobile/src/ui/screens/auth/onboarding_screen.dart';
import 'package:seogadam_mobile/src/ui/layout/network_gate.dart';
import 'package:seogadam_mobile/src/ui/widgets/shared_library_invite_lifecycle.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 로그인 여부·온보딩·네트워크 가드 후 메인 쉘.
///
/// History:
/// - 2026-04-06: `NetworkGate`·프로필 기반 `OnboardingScreen`·`SharedLibraryInviteLifecycle` 순서 정리
/// - 2026-04-02: 로그인 후 `MainShellScreen`(하단 내비·드로어)
/// - 2026-04-25: 로그인 진입 화면을 `LoginScreen`(소셜 전용)으로 교체
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthController>(
      builder: (context, auth, _) {
        if (!auth.isAuthenticated) {
          return const NetworkGate(child: LoginScreen());
        }
        return const _AuthenticatedSessionRoot();
      },
    );
  }
}

class _AuthenticatedSessionRoot extends StatefulWidget {
  const _AuthenticatedSessionRoot();

  @override
  State<_AuthenticatedSessionRoot> createState() => _AuthenticatedSessionRootState();
}

class _AuthenticatedSessionRootState extends State<_AuthenticatedSessionRoot> {
  MeAppProfile? _profile;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProfile());
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<LibraryController>().api;
      final p = await api.fetchMeProfile();
      if (!mounted) return;
      setState(() {
        _profile = p;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  bool get _needsOnboarding {
    final p = _profile;
    if (p == null) return false;
    final s = p.onboardingCompletedAt?.trim();
    return s == null || s.isEmpty;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _loadProfile,
                  child: const Text('다시 시도'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_needsOnboarding) {
      return OnboardingScreen(
        onCompleted: _loadProfile,
      );
    }

    return const NetworkGate(
      child: SharedLibraryInviteLifecycle(
        child: MainShellScreen(),
      ),
    );
  }
}
