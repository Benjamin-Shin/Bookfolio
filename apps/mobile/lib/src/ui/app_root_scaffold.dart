import 'package:flutter/material.dart';

/// [MaterialApp.scaffoldMessengerKey] — 로그인 후 화면 밖(Provider)에서도 SnackBar 표시용.
final GlobalKey<ScaffoldMessengerState> bookfolioRootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

/// [MaterialApp.navigatorKey] — 초대 SnackBar의 「보기」에서 화면 전환.
final GlobalKey<NavigatorState> bookfolioRootNavigatorKey = GlobalKey<NavigatorState>();
