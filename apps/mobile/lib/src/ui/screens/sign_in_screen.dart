import 'dart:io';
import 'dart:math' as math;
import 'dart:ui';

import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:seogadam_mobile/src/theme/bookfolio_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

/// 이메일·비밀번호·Google 로그인 및 에디토리얼 스타일 회원가입(목업 기반).
///
/// History:
/// - 2026-04-24: 로그인 화면을 히어로 카피·글래스 카드·강조 CTA 중심으로 전면 리디자인해 시각적 완성도와 가독성 개선
/// - 2026-04-24: 카카오 버튼을 `AuthController.signInWithKakao()`에 연결
/// - 2026-04-22: 소셜 로그인 에셋 경로를 `assets/` 기준(카카오·구글)으로 변경, 구글 버튼을 카카오와 동일 슬롯 크기로 고정
/// - 2026-04-22: 로그인 로고 에셋 로드 실패 시 붉은 에러 박스 대신 텍스트 폴백 렌더링 추가
/// - 2026-04-22: 로그인 헤더 텍스트 `서가담`을 브랜드 로고 PNG(`assets/brand/Seogadam_Web_logo.png`)로 교체
/// - 2026-04-12: Manrope·구글 테두리 고스트·필드 포커스 `primary` — `#Reference/DESIGN.md` 단일 토큰
/// - 2026-04-05: 로그인 카드 — 「이메일 또는 아이디」, @ 앞 로컬만 입력 가능 안내
///
/// History:
/// - 2026-03-28: 그라데이션·로고·카드 폼·Google 브랜딩 등 UI 정돈
/// - 2026-04-05: HTML 목업(Newsreader/Inter, 언더라인 필드, 아바타·인구통계, 소셜 행) 반영
/// - 2026-04-05: 로그인 전용 목업(카드·블러 배경·구글 컬러 로고·세로 소셜 버튼)
/// - 2026-04-05: 가입 필드 라벨·컨트롤러를 `이름`/`name`(API·display_name 과 동일)으로 통일
/// - 2026-04-05: `DESIGN.md` 토큰(노 디바이더·고스트 보더·muted gold 포커스·반경·레이어링)
/// - 2026-04-05: 카카오 로그인 영역을 공식 `kakao_login_medium_narrow.png` 에셋으로 교체; 헤더 브랜드명 서가담
/// - 2026-04-07: 카카오 PNG를 주 로그인 버튼과 동일 슬롯(전체 너비·높이 52)에 `BoxFit.contain`으로 배치
/// - 2026-04-12: 구글 공식 Android PNG(`web/icons/google_signin_light_rd_si.png`·`google_signup_light_rd_su.png`) — 로그인/가입에 SI·SU; 카카오와 동일 슬롯·`BoxFit.contain`
/// - 2026-04-12: 구글 `#F1F3F5`·카카오 동일 슬롯; 로그인·가입 공통 `_socialContinueCaption`·`_socialKakaoGoogleColumn`으로 소셜 블록 통일
/// - 2026-04-12: 카카오 공식 PNG(183×45) 비율 너비로 주 로그인·소셜 버튼 가운데 정렬(이미지 늘리지 않음)
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  /// 카카오 로그인 버튼 공식 이미지(개발자 가이드 제공 에셋)
  static const _kakaoOfficialAsset = 'assets/kakao_login_medium_narrow.png';

  /// 요청 기준 고정 구글 로그인 이미지(카카오와 동일 슬롯으로 렌더링).
  static const _googleOfficialAsset = 'assets/google_signup_light_sq_su.png';

  /// 공식 `medium_narrow` 에셋 intrinsic 픽셀 크기(파일 메타). 높이 [`_primaryLoginButtonHeight`]에 맞춘 너비로 주 버튼·구글을 정렬.
  static const double _kakaoOfficialImageWidthPx = 183;
  static const double _kakaoOfficialImageHeightPx = 45;

  static const _loginMaxWidth = 440.0;

  /// 이메일 로그인 주 버튼(`로그인`)과 동일한 터치 영역·높이.
  static const _primaryLoginButtonHeight = 52.0;

  /// 카카오 PNG를 늘리지 않고 맞출 때, 주 버튼·카카오·구글이 공유하는 가로 길이.
  static double get _kakaoWidthAlignedButtonWidth =>
      _kakaoOfficialImageWidthPx *
      _primaryLoginButtonHeight /
      _kakaoOfficialImageHeightPx;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _nameFocus = FocusNode();

  bool _isSignIn = true;
  bool _obscurePassword = true;
  String? _gender;
  DateTime? _birthDate;
  XFile? _avatarFile;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _nameFocus.dispose();
    super.dispose();
  }

  String? _guessMime(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final file =
        await picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (file != null) {
      setState(() => _avatarFile = file);
    }
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final initial = _birthDate ?? DateTime(now.year - 25);
    final first = DateTime(1900);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isAfter(first) && initial.isBefore(now)
          ? initial
          : DateTime(1990),
      firstDate: first,
      lastDate: now,
      locale: const Locale('ko', 'KR'),
    );
    if (picked != null) {
      setState(() => _birthDate = picked);
    }
  }

  Future<void> _submit(AuthController auth) async {
    FocusScope.of(context).unfocus();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('이메일(또는 아이디)와 비밀번호를 입력해 주세요.')),
      );
      return;
    }

    if (!_isSignIn && password.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('비밀번호는 8자 이상이어야 합니다.')),
      );
      return;
    }

    if (_isSignIn) {
      await auth.signIn(email: email, password: password);
      return;
    }

    List<int>? avatarBytes;
    String? avatarName;
    String? avatarMime;
    final av = _avatarFile;
    if (av != null) {
      avatarBytes = await av.readAsBytes();
      avatarName = av.name;
      avatarMime = _guessMime(av.name);
    }

    await auth.signUp(
      email: email,
      password: password,
      name: _nameController.text.trim().isEmpty
          ? null
          : _nameController.text.trim(),
      gender: _gender,
      birthDateIso: _birthDate == null
          ? null
          : DateFormat('yyyy-MM-dd').format(_birthDate!),
      avatarBytes: avatarBytes,
      avatarFileName: avatarName,
      avatarMimeType: avatarMime,
    );
  }

  void _switchMode(AuthController auth) {
    auth.clearError();
    setState(() {
      _isSignIn = !_isSignIn;
      if (_isSignIn) {
        _gender = null;
        _birthDate = null;
        _avatarFile = null;
      }
    });
  }

  void _onForgotPassword() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('비밀번호 재설정은 웹에서 곧 제공될 예정입니다.')),
    );
  }

  /// 로그인 폼용 — 고스트 하단선 15%·포커스 muted gold (`DESIGN.md` Selection & Input).
  InputDecoration _loginFieldDecoration({
    required String label,
    String? hint,
  }) {
    final ghost = BookfolioDesignTokens.ghostBorderSide();
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: BookfolioDesignTokens.labelMd(
          BookfolioDesignTokens.onSurfaceVariant,
          opacity: 0.7),
      hintStyle: BookfolioDesignTokens.bodyLg(
          BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.35)),
      floatingLabelBehavior: FloatingLabelBehavior.always,
      contentPadding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
      border: UnderlineInputBorder(borderSide: ghost),
      enabledBorder: UnderlineInputBorder(borderSide: ghost),
      focusedBorder: const UnderlineInputBorder(
        borderSide:
            BorderSide(color: BookfolioDesignTokens.inputFocus, width: 1.5),
      ),
    );
  }

  InputDecoration _underlineDecoration({
    required String label,
    String? hint,
    Widget? suffix,
  }) {
    final ghost = BookfolioDesignTokens.ghostBorderSide();
    return InputDecoration(
      labelText: label,
      hintText: hint,
      suffixIcon: suffix,
      labelStyle:
          BookfolioDesignTokens.labelMd(BookfolioDesignTokens.onSurfaceVariant),
      hintStyle: GoogleFonts.manrope(
        color: BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.35),
        fontSize: 15,
      ),
      floatingLabelBehavior: FloatingLabelBehavior.always,
      contentPadding: const EdgeInsets.only(bottom: 8, top: 4),
      border: UnderlineInputBorder(borderSide: ghost),
      enabledBorder: UnderlineInputBorder(borderSide: ghost),
      focusedBorder: const UnderlineInputBorder(
        borderSide:
            BorderSide(color: BookfolioDesignTokens.inputFocus, width: 1.5),
      ),
    );
  }

  Widget _genderChip(String label, String? value, {bool skip = false}) {
    final selected = skip ? _gender == null : _gender == value;
    final bg = selected
        ? BookfolioDesignTokens.surfaceContainerHigh
        : BookfolioDesignTokens.surfaceContainerLow.withValues(alpha: 0.85);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => setState(() => _gender = skip ? null : value),
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
          ),
          child: Text(
            label,
            style: GoogleFonts.manrope(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: skip && selected
                  ? BookfolioDesignTokens.onSurfaceVariant
                      .withValues(alpha: 0.55)
                  : BookfolioDesignTokens.onSurface,
            ),
          ),
        ),
      ),
    );
  }

  Widget _loginAmbientBackground(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final h = MediaQuery.sizeOf(context).height;
    final orb = w * 0.4;
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(
            top: -h * 0.1,
            right: -w * 0.05,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 72, sigmaY: 72),
              child: Container(
                width: orb,
                height: orb,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: BookfolioDesignTokens.secondaryContainer
                      .withValues(alpha: 0.1),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -h * 0.1,
            left: -w * 0.05,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 72, sigmaY: 72),
              child: Container(
                width: orb,
                height: orb,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: BookfolioDesignTokens.primaryContainer
                      .withValues(alpha: 0.05),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorBanner(AuthController auth) {
    if (auth.error == null) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Material(
        color: const Color(0xFFFFDAD6),
        borderRadius: BorderRadius.circular(BookfolioDesignTokens.radiusSm),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 20, color: Color(0xFF93000A)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  auth.error!,
                  style: GoogleFonts.manrope(
                    fontSize: 13,
                    height: 1.35,
                    color: const Color(0xFF93000A),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// 카카오 공식 이미지 버튼. 부모는 [_kakaoWidthAlignedButtonWidth]·[_primaryLoginButtonHeight] 슬롯; PNG는 `BoxFit.contain`으로 왜곡 없음.
  Widget _kakaoOfficialLoginButton(
      {required bool enabled, required AuthController auth}) {
    final radius = BorderRadius.circular(BookfolioDesignTokens.radiusMd);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? () => auth.signInWithKakao() : null,
        borderRadius: radius,
        child: SizedBox(
          width: double.infinity,
          height: _primaryLoginButtonHeight,
          child: ClipRRect(
            borderRadius: radius,
            child: Image.asset(
              _kakaoOfficialAsset,
              fit: BoxFit.contain,
              alignment: Alignment.center,
            ),
          ),
        ),
      ),
    );
  }

  /// 로그인·가입 공통 — 카카오·구글 버튼 위 구분 문구.
  Widget _socialContinueCaption() {
    return Text(
      '또는 다음으로 계속하기',
      textAlign: TextAlign.center,
      style: BookfolioDesignTokens.labelMd(
        BookfolioDesignTokens.onSurfaceVariant,
        opacity: 0.45,
      ),
    );
  }

  /// 카카오·구글 소셜 버튼 세로 스택(로그인·가입 동일).
  Widget _socialKakaoGoogleColumn(AuthController auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _kakaoOfficialLoginButton(
          enabled: !auth.isLoading,
          auth: auth,
        ),
        const SizedBox(height: 12),
        _googleOfficialLoginButton(
          context,
          auth: auth,
          asset: _googleOfficialAsset,
          enabled: !auth.isLoading,
        ),
      ],
    );
  }

  /// 카카오 슬롯과 동일 — 공식 PNG만 표시(에셋 내 배경·문구).
  Widget _googleOfficialLoginButton(
    BuildContext context, {
    required AuthController auth,
    required String asset,
    required bool enabled,
  }) {
    final radius = BorderRadius.circular(BookfolioDesignTokens.radiusMd);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? () => auth.signInWithGoogle() : null,
        borderRadius: radius,
        child: SizedBox(
          width: double.infinity,
          height: _primaryLoginButtonHeight,
          child: ClipRRect(
            borderRadius: radius,
            child: Image.asset(
              asset,
              fit: BoxFit.contain,
              alignment: Alignment.center,
              semanticLabel: _isSignIn ? 'Google 계정으로 로그인' : 'Google 계정으로 가입하기',
            ),
          ),
        ),
      ),
    );
  }

  /// 카카오 공식 이미지 가로폭에 맞춰 주 버튼·소셜 스택을 가운데 정렬(필드는 전체 너비 유지).
  Widget _kakaoWidthAlignedButtonColumn({required List<Widget> children}) {
    return Align(
      alignment: Alignment.center,
      child: SizedBox(
        width: _kakaoWidthAlignedButtonWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: children,
        ),
      ),
    );
  }

  Widget _buildLoginLayout(AuthController auth) {
    return Stack(
      children: [
        Positioned.fill(child: _loginAmbientBackground(context)),
        SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: SizedBox(
                width: math.min(
                  _loginMaxWidth,
                  MediaQuery.sizeOf(context).width - 48,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildLoginHero(),
                    const SizedBox(height: 22),
                    _buildLoginFormCard(auth),
                    const SizedBox(height: 32),
                    Text.rich(
                      TextSpan(
                        style: GoogleFonts.manrope(
                          fontSize: 14,
                          color: BookfolioDesignTokens.onSurfaceVariant
                              .withValues(alpha: 0.6),
                        ),
                        children: [
                          const TextSpan(text: '계정이 없으신가요? '),
                          WidgetSpan(
                            alignment: PlaceholderAlignment.baseline,
                            baseline: TextBaseline.alphabetic,
                            child: GestureDetector(
                              onTap: auth.isLoading
                                  ? null
                                  : () => _switchMode(auth),
                              child: Text(
                                '회원가입하기',
                                style: GoogleFonts.manrope(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: BookfolioDesignTokens.primary,
                                  decoration: TextDecoration.underline,
                                  decorationColor: BookfolioDesignTokens
                                      .outlineVariant
                                      .withValues(alpha: 0.4),
                                  decorationThickness: 1.2,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginHero() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            BookfolioDesignTokens.secondaryContainer.withValues(alpha: 0.34),
            BookfolioDesignTokens.surfaceContainerLow.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: BookfolioDesignTokens.outlineVariant.withValues(alpha: 0.32),
        ),
        boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: BookfolioDesignTokens.primaryContainer
                    .withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'BOOKFOLIO SIGN IN',
                style: BookfolioDesignTokens.labelMd(
                  BookfolioDesignTokens.onPrimaryContainer,
                  opacity: 0.95,
                ),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 66,
              child: Image.asset(
                'assets/brand/Seogadam_Web_logo.png',
                fit: BoxFit.contain,
                alignment: Alignment.centerLeft,
                semanticLabel: '서가담 로고',
                errorBuilder: (context, error, stackTrace) {
                  return Text(
                    '서가담',
                    style: BookfolioDesignTokens.displayLg(
                        BookfolioDesignTokens.primary),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '독서 기록의 흐름을 이어서 시작하세요',
              style: GoogleFonts.newsreader(
                fontSize: 24,
                fontStyle: FontStyle.italic,
                height: 1.25,
                color: BookfolioDesignTokens.onSurface,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              '큐레이션, 리뷰, 독서 이벤트까지 한 번에 관리할 수 있도록 로그인 경험을 새롭게 다듬었습니다.',
              style: BookfolioDesignTokens.bodyLg(
                BookfolioDesignTokens.onSurfaceVariant.withValues(alpha: 0.88),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginFormCard(AuthController auth) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: BookfolioDesignTokens.glassBlurSigma,
          sigmaY: BookfolioDesignTokens.glassBlurSigma,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: BookfolioDesignTokens.surfaceContainerLowest.withValues(
              alpha: BookfolioDesignTokens.glassSurfaceOpacity,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color:
                  BookfolioDesignTokens.outlineVariant.withValues(alpha: 0.35),
            ),
            boxShadow: BookfolioDesignTokens.ambientShadowPrimary(),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '계정 로그인',
                  style: BookfolioDesignTokens.titleMd(
                      BookfolioDesignTokens.onSurface),
                ),
                const SizedBox(height: 6),
                Text(
                  '이메일 또는 아이디로 빠르게 접속할 수 있어요.',
                  style: BookfolioDesignTokens.bodyLg(
                    BookfolioDesignTokens.onSurfaceVariant
                        .withValues(alpha: 0.82),
                  ),
                ),
                const SizedBox(height: 28),
                TextField(
                  controller: _emailController,
                  focusNode: _emailFocus,
                  keyboardType: TextInputType.text,
                  textInputAction: TextInputAction.next,
                  style: BookfolioDesignTokens.bodyLg(
                      BookfolioDesignTokens.onSurface),
                  cursorColor: BookfolioDesignTokens.primary,
                  autofillHints: const [AutofillHints.username],
                  onSubmitted: (_) => _passwordFocus.requestFocus(),
                  decoration: _loginFieldDecoration(
                    label: '이메일 또는 아이디',
                    hint: 'you@example.com 또는 아이디',
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    '이메일 @ 앞 아이디(영문·숫자 등)만으로도 로그인할 수 있습니다.',
                    style: BookfolioDesignTokens.labelMd(
                      BookfolioDesignTokens.onSurfaceVariant,
                      opacity: 0.65,
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Text(
                            '비밀번호',
                            style: BookfolioDesignTokens.labelMd(
                              BookfolioDesignTokens.onSurfaceVariant,
                              opacity: 0.7,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: _onForgotPassword,
                          child: Padding(
                            padding: const EdgeInsets.only(left: 8, bottom: 2),
                            child: Text(
                              '비밀번호를 잊으셨나요?',
                              style: GoogleFonts.newsreader(
                                fontSize: 14,
                                fontStyle: FontStyle.italic,
                                color: BookfolioDesignTokens.onSurfaceVariant,
                                height: 1.2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    TextField(
                      controller: _passwordController,
                      focusNode: _passwordFocus,
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.done,
                      style: BookfolioDesignTokens.bodyLg(
                          BookfolioDesignTokens.onSurface),
                      cursorColor: BookfolioDesignTokens.primary,
                      autofillHints: const [AutofillHints.password],
                      onSubmitted: (_) => _submit(auth),
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        suffixIcon: IconButton(
                          onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword),
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            size: 20,
                            color: BookfolioDesignTokens.onSurfaceVariant,
                          ),
                        ),
                        hintStyle: BookfolioDesignTokens.bodyLg(
                          BookfolioDesignTokens.onSurfaceVariant
                              .withValues(alpha: 0.35),
                        ),
                        contentPadding: const EdgeInsets.fromLTRB(4, 8, 4, 12),
                        border: UnderlineInputBorder(
                          borderSide: BookfolioDesignTokens.ghostBorderSide(),
                        ),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BookfolioDesignTokens.ghostBorderSide(),
                        ),
                        focusedBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(
                              color: BookfolioDesignTokens.inputFocus,
                              width: 1.5),
                        ),
                      ),
                    ),
                  ],
                ),
                _errorBanner(auth),
                const SizedBox(height: 8),
                _kakaoWidthAlignedButtonColumn(
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(
                            BookfolioDesignTokens.radiusMd),
                        gradient: BookfolioDesignTokens.inkGradient,
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: auth.isLoading ? null : () => _submit(auth),
                          borderRadius: BorderRadius.circular(
                              BookfolioDesignTokens.radiusMd),
                          child: SizedBox(
                            width: double.infinity,
                            height: _primaryLoginButtonHeight,
                            child: Center(
                              child: auth.isLoading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Text(
                                      '로그인',
                                      style: BookfolioDesignTokens.bodyLg(
                                        BookfolioDesignTokens.onPrimary,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    _socialContinueCaption(),
                    const SizedBox(height: 24),
                    _socialKakaoGoogleColumn(auth),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSignUpLayout(AuthController auth) {
    return Stack(
      children: [
        Positioned(
          top: 0,
          right: 0,
          width: MediaQuery.sizeOf(context).width * 0.33,
          height: MediaQuery.sizeOf(context).height,
          child: ColoredBox(
            color: BookfolioDesignTokens.surfaceContainerLow
                .withValues(alpha: 0.5),
          ),
        ),
        SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.sizeOf(context).height -
                    MediaQuery.paddingOf(context).vertical -
                    56,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  Text(
                    '서가담 가입',
                    textAlign: TextAlign.center,
                    style: BookfolioDesignTokens.displayLg(
                        BookfolioDesignTokens.primary),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Begin your curated reading journey',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.newsreader(
                      fontSize: 20,
                      height: 1.3,
                      color: BookfolioDesignTokens.onSurfaceVariant
                          .withValues(alpha: 0.82),
                    ),
                  ),
                  const SizedBox(height: 40),
                  Center(
                    child: Column(
                      children: [
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: auth.isLoading ? null : _pickAvatar,
                            customBorder: const CircleBorder(),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 112,
                                  height: 112,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: BookfolioDesignTokens
                                        .surfaceContainerHigh,
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: _avatarFile != null
                                      ? Image.file(
                                          File(_avatarFile!.path),
                                          fit: BoxFit.cover,
                                        )
                                      : Icon(
                                          Icons.photo_camera_outlined,
                                          size: 40,
                                          color: BookfolioDesignTokens
                                              .onSurfaceVariant
                                              .withValues(alpha: 0.55),
                                        ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          '아바타 이미지 (선택)',
                          style: BookfolioDesignTokens.labelMd(
                              BookfolioDesignTokens.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 36),
                  TextField(
                    controller: _emailController,
                    focusNode: _emailFocus,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    style: BookfolioDesignTokens.bodyLg(
                        BookfolioDesignTokens.onSurface),
                    cursorColor: BookfolioDesignTokens.primary,
                    autofillHints: const [AutofillHints.email],
                    onSubmitted: (_) => _passwordFocus.requestFocus(),
                    decoration: _underlineDecoration(
                      label: '이메일',
                      hint: 'you@example.com',
                    ),
                  ),
                  const SizedBox(height: 22),
                  TextField(
                    controller: _passwordController,
                    focusNode: _passwordFocus,
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.next,
                    style: BookfolioDesignTokens.bodyLg(
                        BookfolioDesignTokens.onSurface),
                    cursorColor: BookfolioDesignTokens.primary,
                    autofillHints: const [AutofillHints.newPassword],
                    onSubmitted: (_) => _nameFocus.requestFocus(),
                    decoration: _underlineDecoration(
                      label: '비밀번호',
                      hint: '••••••••',
                      suffix: IconButton(
                        onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword),
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                          color: BookfolioDesignTokens.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  TextField(
                    controller: _nameController,
                    focusNode: _nameFocus,
                    textInputAction: TextInputAction.done,
                    style: BookfolioDesignTokens.bodyLg(
                        BookfolioDesignTokens.onSurface),
                    cursorColor: BookfolioDesignTokens.primary,
                    onSubmitted: (_) => _submit(auth),
                    decoration: _underlineDecoration(
                      label: '이름',
                      hint: '서재에 표시되는 이름',
                    ),
                  ),
                  const SizedBox(height: 28),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '성별 (선택)',
                      style: BookfolioDesignTokens.labelMd(
                          BookfolioDesignTokens.onSurfaceVariant),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _genderChip('Male', 'male'),
                      _genderChip('Female', 'female'),
                      _genderChip('Other', 'other'),
                      _genderChip('Skip', null, skip: true),
                    ],
                  ),
                  const SizedBox(height: 22),
                  GestureDetector(
                    onTap: auth.isLoading ? null : _pickBirthDate,
                    child: InputDecorator(
                      decoration: _underlineDecoration(
                        label: '생년월일 (선택)',
                        hint: 'YYYY . MM . DD',
                      ),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4, bottom: 8),
                        child: Text(
                          _birthDate == null
                              ? 'YYYY . MM . DD'
                              : DateFormat.yMMMMd('ko_KR').format(_birthDate!),
                          style: BookfolioDesignTokens.bodyLg(
                            _birthDate == null
                                ? BookfolioDesignTokens.onSurfaceVariant
                                    .withValues(alpha: 0.35)
                                : BookfolioDesignTokens.onSurface,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (auth.error != null) ...[
                    const SizedBox(height: 20),
                    Material(
                      color: const Color(0xFFFFDAD6),
                      borderRadius:
                          BorderRadius.circular(BookfolioDesignTokens.radiusSm),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.error_outline_rounded,
                                size: 20, color: Color(0xFF93000A)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                auth.error!,
                                style: GoogleFonts.manrope(
                                  fontSize: 13,
                                  height: 1.35,
                                  color: const Color(0xFF93000A),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 28),
                  _kakaoWidthAlignedButtonColumn(
                    children: [
                      DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(
                              BookfolioDesignTokens.radiusMd),
                          gradient: BookfolioDesignTokens.inkGradient,
                          boxShadow:
                              BookfolioDesignTokens.ambientShadowPrimary(),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: auth.isLoading ? null : () => _submit(auth),
                            borderRadius: BorderRadius.circular(
                                BookfolioDesignTokens.radiusMd),
                            child: SizedBox(
                              width: double.infinity,
                              height: _primaryLoginButtonHeight,
                              child: Center(
                                child: auth.isLoading
                                    ? const SizedBox(
                                        height: 22,
                                        width: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(
                                        '계정 생성하기',
                                        style: BookfolioDesignTokens.bodyLg(
                                          BookfolioDesignTokens.onPrimary,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      _socialContinueCaption(),
                      const SizedBox(height: 24),
                      _socialKakaoGoogleColumn(auth),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Center(
                    child: Text.rich(
                      TextSpan(
                        style: GoogleFonts.manrope(
                            fontSize: 14,
                            color: BookfolioDesignTokens.onSurfaceVariant),
                        children: [
                          const TextSpan(text: '이미 계정이 있으신가요? '),
                          WidgetSpan(
                            alignment: PlaceholderAlignment.middle,
                            child: GestureDetector(
                              onTap: auth.isLoading
                                  ? null
                                  : () => _switchMode(auth),
                              child: Text(
                                '로그인하기',
                                style: GoogleFonts.manrope(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.4,
                                  color: BookfolioDesignTokens.primary,
                                  decoration: TextDecoration.underline,
                                  decorationThickness: 1,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      backgroundColor: BookfolioDesignTokens.surface,
      body: _isSignIn ? _buildLoginLayout(auth) : _buildSignUpLayout(auth),
    );
  }
}
