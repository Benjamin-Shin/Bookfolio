import 'dart:math' as math;

import 'package:seogadam_mobile/src/models/book_models.dart';

/// 독서 성향·지표 계산(서가 전체 [UserBook] 스냅샷 기준).
///
/// 서버에 완독 시각이 없어 `updatedAt`·`createdAt`으로 근사합니다.
class ReadingTendencySnapshot {
  const ReadingTendencySnapshot({
    required this.bookCount,
    required this.completionRatePercent,
    required this.diversityScore,
    required this.speedScore,
    required this.persistenceScore,
    required this.depthScore,
    required this.spikeConcentration,
    required this.persona,
  });

  final int bookCount;
  final int completionRatePercent;
  final int diversityScore;
  final int speedScore;
  final int persistenceScore;
  final int depthScore;

  /// 최근 6개월 중 가장 붐빈 달 비중(0~1). 감성형 판별용.
  final double spikeConcentration;
  final ReadingPersona persona;
}

enum ReadingPersonaKind {
  inquiry,
  routine,
  exploration,
  speedReading,
  deliberate,
  emotional,
}

class ReadingPersona {
  const ReadingPersona({
    required this.kind,
    required this.title,
    required this.description,
    required this.tags,
    required this.imageAssetPath,
  });

  final ReadingPersonaKind kind;
  final String title;
  final String description;
  final List<String> tags;
  final String imageAssetPath;

  static const inquiryImage = 'assets/reading-type/Reading-InquiryType.png';
  static const routineImage = 'assets/reading-type/Reading-RoutineType.png';
  static const explorationImage =
      'assets/reading-type/Reading-ExplorationType.png';
  static const speedImage = 'assets/reading-type/Reading-SpeedType.png';
  static const deliberateImage = 'assets/reading-type/Reading-Type.png';
  static const emotionalImage =
      'assets/reading-type/Reading-EmotionalType.png';

  static ReadingPersona balancedFallback() {
    return const ReadingPersona(
      kind: ReadingPersonaKind.inquiry,
      title: '균형 잡힌 독서가 ✨',
      description:
          '아직 패턴이 뚜렷하지 않아요.\n책을 더 쌓아두면 당신만의 성향이 선명해져요.',
      tags: ['기록 유지', '꾸준히 추가', '성향 형성 중'],
      imageAssetPath: inquiryImage,
    );
  }

  static ReadingPersona sparseData() {
    return const ReadingPersona(
      kind: ReadingPersonaKind.inquiry,
      title: '시작의 독서가 ✨',
      description:
          '서가에 책이 거의 없어 성향을 분석하기 어려워요.\n몇 권만 더 기록해 볼까요?',
      tags: ['데이터 부족', '첫 기록', '성장 준비'],
      imageAssetPath: inquiryImage,
    );
  }
}

DateTime? _parseApiDate(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  return DateTime.tryParse(raw);
}

int? _effectivePages(UserBook b) {
  return b.effectiveTotalPages ??
      (b.currentPage != null && b.currentPage! > 0 ? b.currentPage : null);
}

/// 완독률 0~100 (등록 권수 대비 완독).
int _completionRatePercent(List<UserBook> books) {
  if (books.isEmpty) return 0;
  final done =
      books.where((b) => b.readingStatus == ReadingStatus.completed).length;
  return ((done / books.length) * 100).round().clamp(0, 100);
}

/// 장르 슬러그 기반 다양성 0~100 (고유 슬러그 수·분포 엔트로피).
int _diversityScore(List<UserBook> books) {
  final slugs = <String>{};
  for (final b in books) {
    for (final g in b.genreSlugs) {
      final t = g.trim();
      if (t.isNotEmpty) slugs.add(t);
    }
  }
  if (slugs.isEmpty) {
    // 장르 메타가 없으면 제목 해시 대신 완만한 값(저자 다양성은 노이즈가 커서 생략)
    return books.length >= 8 ? 35 : (books.length * 4).clamp(0, 32);
  }
  final u = slugs.length;
  final counts = <String, int>{};
  for (final b in books) {
    for (final g in b.genreSlugs) {
      final t = g.trim();
      if (t.isEmpty) continue;
      counts[t] = (counts[t] ?? 0) + 1;
    }
  }
  final totalAssignments = counts.values.fold<int>(0, (a, c) => a + c);
  if (totalAssignments <= 0) return (u * 12).clamp(0, 100);
  var h = 0.0;
  for (final c in counts.values) {
    final p = c / totalAssignments;
    h -= p * math.log(p) / math.ln2;
  }
  final maxH = math.log(math.max(2, u)) / math.ln2;
  final norm = maxH > 0 ? (h / maxH) : 0.0;
  final mix = 0.55 * norm + 0.45 * (u / (8 + u));
  return (mix * 100).round().clamp(0, 100);
}

/// 평균 분량(쪽) 기반 깊이 점수 0~100.
int _depthScore(List<UserBook> books) {
  final pages = <int>[];
  for (final b in books) {
    final p = _effectivePages(b);
    if (p != null && p >= 40) pages.add(p);
  }
  if (pages.isEmpty) return 0;
  final avg = pages.reduce((a, b) => a + b) / pages.length;
  return ((avg / 420) * 100).round().clamp(0, 100);
}

/// 완독 권의 (업데이트-생성) 일수로 페이지/일 근사 → 속도 0~100.
int _speedScore(List<UserBook> books) {
  final rates = <double>[];
  for (final b in books) {
    if (b.readingStatus != ReadingStatus.completed) continue;
    final pages = _effectivePages(b);
    if (pages == null || pages < 30) continue;
    final c = _parseApiDate(b.createdAt);
    final u = _parseApiDate(b.updatedAt) ?? c;
    if (c == null || u == null) continue;
    var days = u.difference(c).inDays + 1;
    if (days < 1) days = 1;
    rates.add(pages / days);
  }
  if (rates.isEmpty) return 40;
  rates.sort();
  final median = rates[rates.length ~/ 2];
  return ((median / 72) * 100).round().clamp(0, 100);
}

/// 최근 6개월 월별 활동(해당 월에 `updatedAt`이 찍힌 권수)의 균등도 → 지속성 0~100.
int _persistenceScore(List<UserBook> books, DateTime now) {
  final monthStarts = List.generate(6, (i) {
    final d = DateTime(now.year, now.month, 1);
    return DateTime(d.year, d.month - (5 - i), 1);
  });
  final counts = List<int>.filled(6, 0);
  for (final b in books) {
    final u = _parseApiDate(b.updatedAt);
    if (u == null) continue;
    for (var i = 0; i < 6; i++) {
      final start = monthStarts[i];
      final end = DateTime(start.year, start.month + 1, 1);
      if (!u.isBefore(start) && u.isBefore(end)) {
        counts[i]++;
        break;
      }
    }
  }
  final sum = counts.fold<int>(0, (a, c) => a + c);
  if (sum == 0) return 25;
  final mean = sum / 6;
  var varSum = 0.0;
  for (final c in counts) {
    final d = c - mean;
    varSum += d * d;
  }
  final std = math.sqrt(varSum / 6);
  final cv = mean > 0.5 ? std / mean : 1.0;
  return (100 * (1 - cv.clamp(0, 1.4) / 1.4)).round().clamp(0, 100);
}

/// 최근 6개월 중 가장 많이 찍힌 달 / 전체 비중.
double _spikeConcentration(List<UserBook> books, DateTime now) {
  final monthStarts = List.generate(6, (i) {
    final d = DateTime(now.year, now.month, 1);
    return DateTime(d.year, d.month - (5 - i), 1);
  });
  final counts = List<int>.filled(6, 0);
  for (final b in books) {
    final u = _parseApiDate(b.updatedAt);
    if (u == null) continue;
    for (var i = 0; i < 6; i++) {
      final start = monthStarts[i];
      final end = DateTime(start.year, start.month + 1, 1);
      if (!u.isBefore(start) && u.isBefore(end)) {
        counts[i]++;
        break;
      }
    }
  }
  final sum = counts.fold<int>(0, (a, c) => a + c);
  if (sum == 0) return 0;
  final mx = counts.reduce(math.max);
  return (mx / sum).clamp(0, 1);
}

ReadingPersona _pickPersona({
  required int completion,
  required int diversity,
  required int speed,
  required int persistence,
  required int depth,
  required double spike,
}) {
  final lowPersistence = persistence <= 38;
  final highPersistence = persistence >= 58;
  final spiky = spike >= 0.48;
  final slow = speed <= 44;
  final fast = speed >= 62;
  final highCompletion = completion >= 56;
  final highDepth = depth >= 54;
  final highDiv = diversity >= 64;

  if (lowPersistence && spiky && completion < 92) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.emotional,
      title: '감성형 독서가 ✨',
      description:
          '기분과 때에 따라 몰입해서 읽는 스타일이에요.\n특정 시기에 몰아 읽는 경향이 보여요.',
      tags: ['기분파', '분위기 중시', '몰입 순간'],
      imageAssetPath: ReadingPersona.emotionalImage,
    );
  }

  if (highDiv && diversity >= completion - 8) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.exploration,
      title: '탐험형 독서가 ✨',
      description:
          '여러 분야를 넘나드는 잡식 독서가에 가깝습니다.\n호기심이 넓게 펼쳐져 있어요.',
      tags: ['잡식 독서', '다양한 분야', '호기심 천국'],
      imageAssetPath: ReadingPersona.explorationImage,
    );
  }

  if (slow && highCompletion) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.deliberate,
      title: '정독형 독서가 ✨',
      description:
          '한 권을 천천히, 끝까지 읽는 스타일이에요.\n완독에 집중하는 깊이가 느껴져요.',
      tags: ['느긋한 속도', '완독 집중', '깊이 읽기'],
      imageAssetPath: ReadingPersona.deliberateImage,
    );
  }

  if (fast && !(slow && highCompletion)) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.speedReading,
      title: '속독형 독서가 ✨',
      description:
          '짧은 기간에 많은 분량을 소화하는 편이에요.\n빠른 독서 리듬이 돋보여요.',
      tags: ['빠른 속도', '다량 독서', '몰아읽기'],
      imageAssetPath: ReadingPersona.speedImage,
    );
  }

  if (highPersistence && !spiky && diversity < 78) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.routine,
      title: '루틴형 독서가 ✨',
      description:
          '매달 꾸준히 기록이 이어지는 습관형에 가깝습니다.\n조금씩이라도 자주 만나는 타입이에요.',
      tags: ['매일 습관', '꾸준함', '안정적 리듬'],
      imageAssetPath: ReadingPersona.routineImage,
    );
  }

  if (highDepth && highCompletion) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.inquiry,
      title: '탐구형 독서가 ✨',
      description:
          '깊이 있는 주제를 꾸준히 파고드는 스타일이에요.\n완독률이 높고 집중력이 뛰어나요.',
      tags: ['깊이 있는 탐구', '완독률 높음', '꾸준함'],
      imageAssetPath: ReadingPersona.inquiryImage,
    );
  }

  if (completion >= 50) {
    return const ReadingPersona(
      kind: ReadingPersonaKind.inquiry,
      title: '탐구형 독서가 ✨',
      description:
          '완독을 중시하며 한 권씩 의미 있게 읽는 편이에요.\n기록이 쌓일수록 성향이 더 선명해져요.',
      tags: ['완독 중시', '의미 있는 독서', '성장형'],
      imageAssetPath: ReadingPersona.inquiryImage,
    );
  }

  return ReadingPersona.balancedFallback();
}

/// 서가 전체 도서로 성향 스냅샷을 만듭니다.
ReadingTendencySnapshot computeReadingTendency(List<UserBook> books) {
  final now = DateTime.now();
  if (books.isEmpty) {
    return ReadingTendencySnapshot(
      bookCount: 0,
      completionRatePercent: 0,
      diversityScore: 0,
      speedScore: 0,
      persistenceScore: 0,
      depthScore: 0,
      spikeConcentration: 0,
      persona: ReadingPersona.sparseData(),
    );
  }

  final completion = _completionRatePercent(books);
  final diversity = _diversityScore(books);
  final speed = _speedScore(books);
  final persistence = _persistenceScore(books, now);
  final depth = _depthScore(books);
  final spike = _spikeConcentration(books, now);

  if (books.length < 2) {
    return ReadingTendencySnapshot(
      bookCount: books.length,
      completionRatePercent: completion,
      diversityScore: diversity,
      speedScore: speed,
      persistenceScore: persistence,
      depthScore: depth,
      spikeConcentration: spike,
      persona: ReadingPersona.sparseData(),
    );
  }

  var persona = _pickPersona(
    completion: completion,
    diversity: diversity,
    speed: speed,
    persistence: persistence,
    depth: depth,
    spike: spike,
  );

  if (books.length < 4) {
    persona = ReadingPersona(
      kind: persona.kind,
      title: persona.title,
      description:
          '${persona.description}\n(권수가 적어 근사 분석이에요. 더 쌓이면 정확해져요.)',
      tags: persona.tags,
      imageAssetPath: persona.imageAssetPath,
    );
  }

  return ReadingTendencySnapshot(
    bookCount: books.length,
    completionRatePercent: completion,
    diversityScore: diversity,
    speedScore: speed,
    persistenceScore: persistence,
    depthScore: depth,
    spikeConcentration: spike,
    persona: persona,
  );
}
