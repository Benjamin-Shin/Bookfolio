import 'package:seogadam_mobile/src/util/user_book_tags.dart';
import 'package:flutter/material.dart';

/// 책당 최대 5개 사용자 태그 입력.
///
/// History:
/// - 2026-06-05: 태그 추가(엔터·버튼) 후 입력란 포커스 유지
/// - 2026-05-24: `user_books.tags` — 책 추가·수정 공통
class UserBookTagsInput extends StatefulWidget {
  const UserBookTagsInput({
    super.key,
    required this.tags,
    required this.onChanged,
    this.suggestions = const [],
  });

  final List<String> tags;
  final ValueChanged<List<String>> onChanged;
  final List<String> suggestions;

  @override
  State<UserBookTagsInput> createState() => _UserBookTagsInputState();
}

class _UserBookTagsInputState extends State<UserBookTagsInput> {
  final _draftCtrl = TextEditingController();
  final _draftFocus = FocusNode();

  @override
  void dispose() {
    _draftCtrl.dispose();
    _draftFocus.dispose();
    super.dispose();
  }

  void _refocusDraftField() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_draftFocus.canRequestFocus) return;
      _draftFocus.requestFocus();
    });
  }

  void _addDraft() {
    final next = normalizeUserBookTags([...widget.tags, _draftCtrl.text]);
    if (next.length == widget.tags.length && _draftCtrl.text.trim().isNotEmpty) {
      _refocusDraftField();
      return;
    }
    if (_draftCtrl.text.trim().isEmpty) {
      _refocusDraftField();
      return;
    }
    widget.onChanged(next);
    _draftCtrl.clear();
    _refocusDraftField();
  }

  void _remove(String tag) {
    widget.onChanged(widget.tags.where((t) => t != tag).toList());
  }

  @override
  Widget build(BuildContext context) {
    final canAdd = widget.tags.length < kUserBookTagMaxCount;
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '태그 (선택, 최대 $kUserBookTagMaxCount개)',
          style: theme.textTheme.titleSmall,
        ),
        const SizedBox(height: 4),
        Text(
          '내 서가에서 분류할 때 씁니다. 장르 통계와는 별개예요.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        if (widget.tags.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final tag in widget.tags)
                InputChip(
                  label: Text(tag),
                  onDeleted: () => _remove(tag),
                ),
            ],
          ),
        ],
        if (canAdd) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _draftCtrl,
                  focusNode: _draftFocus,
                  maxLength: kUserBookTagMaxLength,
                  decoration: const InputDecoration(
                    hintText: '예: 업무, 재독',
                    isDense: true,
                    counterText: '',
                  ),
                  onSubmitted: (_) => _addDraft(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(onPressed: _addDraft, child: const Text('추가')),
            ],
          ),
        ],
        if (widget.suggestions.isNotEmpty && canAdd) ...[
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              Text('최근:', style: theme.textTheme.labelSmall),
              for (final s in widget.suggestions
                  .where((s) => !widget.tags
                      .any((t) => t.toLowerCase() == s.toLowerCase()))
                  .take(12))
                ActionChip(
                  label: Text(s),
                  onPressed: () {
                    widget.onChanged(normalizeUserBookTags([...widget.tags, s]));
                  },
                ),
            ],
          ),
        ],
      ],
    );
  }
}
