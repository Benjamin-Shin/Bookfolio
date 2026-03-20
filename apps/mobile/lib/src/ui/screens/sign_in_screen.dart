import 'package:bookfolio_mobile/src/state/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSignIn = true;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              Text('Bookfolio', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(
                '개인 서재를 기록하는 가장 가벼운 시작',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: '이메일'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: '비밀번호'),
              ),
              const SizedBox(height: 16),
              if (auth.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(auth.error!, style: const TextStyle(color: Colors.red)),
                ),
              FilledButton(
                onPressed: auth.isLoading
                    ? null
                    : () async {
                        if (_isSignIn) {
                          await auth.signIn(
                            email: _emailController.text.trim(),
                            password: _passwordController.text.trim(),
                          );
                        } else {
                          await auth.signUp(
                            email: _emailController.text.trim(),
                            password: _passwordController.text.trim(),
                          );
                        }
                      },
                child: Text(auth.isLoading ? '처리 중...' : _isSignIn ? '로그인' : '회원가입'),
              ),
              if (_isSignIn) ...[
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: auth.isLoading ? null : () => auth.signInWithGoogle(),
                  child: const Text('Google로 계속하기'),
                ),
              ],
              TextButton(
                onPressed: () => setState(() => _isSignIn = !_isSignIn),
                child: Text(_isSignIn ? '계정 만들기' : '이미 계정이 있어요'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

