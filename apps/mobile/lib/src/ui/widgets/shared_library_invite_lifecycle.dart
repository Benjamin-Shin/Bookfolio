import 'package:seogadam_mobile/src/state/shared_library_invite_controller.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

/// 로그인 상태에서 앱 라이프사이클에 맞춰 모임서가 초대 폴링을 켜고 끕니다.
class SharedLibraryInviteLifecycle extends StatefulWidget {
  const SharedLibraryInviteLifecycle({super.key, required this.child});

  final Widget child;

  @override
  State<SharedLibraryInviteLifecycle> createState() =>
      _SharedLibraryInviteLifecycleState();
}

class _SharedLibraryInviteLifecycleState
    extends State<SharedLibraryInviteLifecycle> with WidgetsBindingObserver {
  SharedLibraryInviteController? _invite;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _invite?.onForeground();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _invite = context.read<SharedLibraryInviteController>();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _invite?.onBackground();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final c = _invite;
    if (c == null) return;
    if (state == AppLifecycleState.resumed) {
      c.onForeground();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached ||
        state == AppLifecycleState.hidden) {
      c.onBackground();
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
