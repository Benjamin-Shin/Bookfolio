import 'package:seogadam_mobile/src/models/shared_library_models.dart';
import 'package:seogadam_mobile/src/services/bookfolio_api.dart';
import 'package:seogadam_mobile/src/state/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SharedLibraryEditScreen extends StatefulWidget {
  const SharedLibraryEditScreen({super.key, this.initial});

  final SharedLibrarySummary? initial;

  bool get isEdit => initial != null;

  @override
  State<SharedLibraryEditScreen> createState() => _SharedLibraryEditScreenState();
}

class _SharedLibraryEditScreenState extends State<SharedLibraryEditScreen> {
  static const _kPrimary = Color(0xFF0E6A3C);
  static const _kBorder = Color(0xFFE9E3DE);
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _imageCtrl = TextEditingController();
  String _kind = 'club';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    if (i != null) {
      _nameCtrl.text = i.name;
      _descCtrl.text = i.description ?? '';
      _imageCtrl.text = i.imageUrl ?? '';
      _kind = i.kind;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _imageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('모임서가 이름을 입력해 주세요.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthController>();
      final api = BookfolioApi()..accessToken = () => auth.session?.accessToken;

      SharedLibrarySummary result;
      if (widget.isEdit) {
        result = await api.updateSharedLibrary(
          widget.initial!.id,
          name: name,
          kind: _kind,
          description: _descCtrl.text.trim(),
          imageUrl: _imageCtrl.text.trim(),
        );
      } else {
        result = await api.createSharedLibrary(
          name: name,
          kind: _kind,
          description: _descCtrl.text.trim(),
          imageUrl: _imageCtrl.text.trim(),
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(result);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? '모임서가 수정' : '모임서가 만들기'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('대표 이미지 URL', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                TextField(
                  controller: _imageCtrl,
                  decoration: const InputDecoration(
                    hintText: 'https://...',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 16),
                Text('모임서가 이름', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                TextField(
                  controller: _nameCtrl,
                  maxLength: 30,
                  decoration: const InputDecoration(
                    hintText: '예: 토요일 독서모임',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 8),
                Text('설명', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                TextField(
                  controller: _descCtrl,
                  minLines: 4,
                  maxLines: 4,
                  maxLength: 150,
                  decoration: const InputDecoration(
                    hintText: '모임 소개를 입력해 주세요.',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'club', label: Text('모임')),
                    ButtonSegment(value: 'family', label: Text('가족')),
                  ],
                  selected: {_kind},
                  onSelectionChanged: (selection) {
                    setState(() => _kind = selection.first);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              backgroundColor: _kPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(widget.isEdit ? '모임서가 수정하기' : '모임서가 만들기'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: _submitting ? null : () => Navigator.of(context).maybePop(),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
              side: const BorderSide(color: _kPrimary, width: 1.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('취소'),
          ),
        ],
      ),
    );
  }
}
