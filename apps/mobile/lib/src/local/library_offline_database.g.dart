// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_offline_database.dart';

// ignore_for_file: type=lint
class $CachedUserBooksTable extends CachedUserBooks
    with TableInfo<$CachedUserBooksTable, CachedUserBook> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedUserBooksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _ownerUserIdMeta =
      const VerificationMeta('ownerUserId');
  @override
  late final GeneratedColumn<String> ownerUserId = GeneratedColumn<String>(
      'owner_user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userBookIdMeta =
      const VerificationMeta('userBookId');
  @override
  late final GeneratedColumn<String> userBookId = GeneratedColumn<String>(
      'user_book_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMsMeta =
      const VerificationMeta('cachedAtMs');
  @override
  late final GeneratedColumn<int> cachedAtMs = GeneratedColumn<int>(
      'cached_at_ms', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [ownerUserId, userBookId, payloadJson, cachedAtMs];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_user_books';
  @override
  VerificationContext validateIntegrity(Insertable<CachedUserBook> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('owner_user_id')) {
      context.handle(
          _ownerUserIdMeta,
          ownerUserId.isAcceptableOrUnknown(
              data['owner_user_id']!, _ownerUserIdMeta));
    } else if (isInserting) {
      context.missing(_ownerUserIdMeta);
    }
    if (data.containsKey('user_book_id')) {
      context.handle(
          _userBookIdMeta,
          userBookId.isAcceptableOrUnknown(
              data['user_book_id']!, _userBookIdMeta));
    } else if (isInserting) {
      context.missing(_userBookIdMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('cached_at_ms')) {
      context.handle(
          _cachedAtMsMeta,
          cachedAtMs.isAcceptableOrUnknown(
              data['cached_at_ms']!, _cachedAtMsMeta));
    } else if (isInserting) {
      context.missing(_cachedAtMsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {ownerUserId, userBookId};
  @override
  CachedUserBook map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedUserBook(
      ownerUserId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}owner_user_id'])!,
      userBookId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_book_id'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      cachedAtMs: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}cached_at_ms'])!,
    );
  }

  @override
  $CachedUserBooksTable createAlias(String alias) {
    return $CachedUserBooksTable(attachedDatabase, alias);
  }
}

class CachedUserBook extends DataClass implements Insertable<CachedUserBook> {
  final String ownerUserId;
  final String userBookId;
  final String payloadJson;
  final int cachedAtMs;
  const CachedUserBook(
      {required this.ownerUserId,
      required this.userBookId,
      required this.payloadJson,
      required this.cachedAtMs});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['owner_user_id'] = Variable<String>(ownerUserId);
    map['user_book_id'] = Variable<String>(userBookId);
    map['payload_json'] = Variable<String>(payloadJson);
    map['cached_at_ms'] = Variable<int>(cachedAtMs);
    return map;
  }

  CachedUserBooksCompanion toCompanion(bool nullToAbsent) {
    return CachedUserBooksCompanion(
      ownerUserId: Value(ownerUserId),
      userBookId: Value(userBookId),
      payloadJson: Value(payloadJson),
      cachedAtMs: Value(cachedAtMs),
    );
  }

  factory CachedUserBook.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedUserBook(
      ownerUserId: serializer.fromJson<String>(json['ownerUserId']),
      userBookId: serializer.fromJson<String>(json['userBookId']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      cachedAtMs: serializer.fromJson<int>(json['cachedAtMs']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'ownerUserId': serializer.toJson<String>(ownerUserId),
      'userBookId': serializer.toJson<String>(userBookId),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'cachedAtMs': serializer.toJson<int>(cachedAtMs),
    };
  }

  CachedUserBook copyWith(
          {String? ownerUserId,
          String? userBookId,
          String? payloadJson,
          int? cachedAtMs}) =>
      CachedUserBook(
        ownerUserId: ownerUserId ?? this.ownerUserId,
        userBookId: userBookId ?? this.userBookId,
        payloadJson: payloadJson ?? this.payloadJson,
        cachedAtMs: cachedAtMs ?? this.cachedAtMs,
      );
  CachedUserBook copyWithCompanion(CachedUserBooksCompanion data) {
    return CachedUserBook(
      ownerUserId:
          data.ownerUserId.present ? data.ownerUserId.value : this.ownerUserId,
      userBookId:
          data.userBookId.present ? data.userBookId.value : this.userBookId,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      cachedAtMs:
          data.cachedAtMs.present ? data.cachedAtMs.value : this.cachedAtMs,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedUserBook(')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('userBookId: $userBookId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('cachedAtMs: $cachedAtMs')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(ownerUserId, userBookId, payloadJson, cachedAtMs);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedUserBook &&
          other.ownerUserId == this.ownerUserId &&
          other.userBookId == this.userBookId &&
          other.payloadJson == this.payloadJson &&
          other.cachedAtMs == this.cachedAtMs);
}

class CachedUserBooksCompanion extends UpdateCompanion<CachedUserBook> {
  final Value<String> ownerUserId;
  final Value<String> userBookId;
  final Value<String> payloadJson;
  final Value<int> cachedAtMs;
  final Value<int> rowid;
  const CachedUserBooksCompanion({
    this.ownerUserId = const Value.absent(),
    this.userBookId = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.cachedAtMs = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedUserBooksCompanion.insert({
    required String ownerUserId,
    required String userBookId,
    required String payloadJson,
    required int cachedAtMs,
    this.rowid = const Value.absent(),
  })  : ownerUserId = Value(ownerUserId),
        userBookId = Value(userBookId),
        payloadJson = Value(payloadJson),
        cachedAtMs = Value(cachedAtMs);
  static Insertable<CachedUserBook> custom({
    Expression<String>? ownerUserId,
    Expression<String>? userBookId,
    Expression<String>? payloadJson,
    Expression<int>? cachedAtMs,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (ownerUserId != null) 'owner_user_id': ownerUserId,
      if (userBookId != null) 'user_book_id': userBookId,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (cachedAtMs != null) 'cached_at_ms': cachedAtMs,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedUserBooksCompanion copyWith(
      {Value<String>? ownerUserId,
      Value<String>? userBookId,
      Value<String>? payloadJson,
      Value<int>? cachedAtMs,
      Value<int>? rowid}) {
    return CachedUserBooksCompanion(
      ownerUserId: ownerUserId ?? this.ownerUserId,
      userBookId: userBookId ?? this.userBookId,
      payloadJson: payloadJson ?? this.payloadJson,
      cachedAtMs: cachedAtMs ?? this.cachedAtMs,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (ownerUserId.present) {
      map['owner_user_id'] = Variable<String>(ownerUserId.value);
    }
    if (userBookId.present) {
      map['user_book_id'] = Variable<String>(userBookId.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (cachedAtMs.present) {
      map['cached_at_ms'] = Variable<int>(cachedAtMs.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedUserBooksCompanion(')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('userBookId: $userBookId, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('cachedAtMs: $cachedAtMs, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LibraryCacheMetaTable extends LibraryCacheMeta
    with TableInfo<$LibraryCacheMetaTable, LibraryCacheMetaData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LibraryCacheMetaTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _ownerUserIdMeta =
      const VerificationMeta('ownerUserId');
  @override
  late final GeneratedColumn<String> ownerUserId = GeneratedColumn<String>(
      'owner_user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _scopeKeyMeta =
      const VerificationMeta('scopeKey');
  @override
  late final GeneratedColumn<String> scopeKey = GeneratedColumn<String>(
      'scope_key', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncAtMsMeta =
      const VerificationMeta('lastSyncAtMs');
  @override
  late final GeneratedColumn<int> lastSyncAtMs = GeneratedColumn<int>(
      'last_sync_at_ms', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _serverTotalMeta =
      const VerificationMeta('serverTotal');
  @override
  late final GeneratedColumn<int> serverTotal = GeneratedColumn<int>(
      'server_total', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _lastServerPageMeta =
      const VerificationMeta('lastServerPage');
  @override
  late final GeneratedColumn<int> lastServerPage = GeneratedColumn<int>(
      'last_server_page', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _lastPageSizeMeta =
      const VerificationMeta('lastPageSize');
  @override
  late final GeneratedColumn<int> lastPageSize = GeneratedColumn<int>(
      'last_page_size', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        ownerUserId,
        scopeKey,
        lastSyncAtMs,
        serverTotal,
        lastServerPage,
        lastPageSize
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'library_cache_meta';
  @override
  VerificationContext validateIntegrity(
      Insertable<LibraryCacheMetaData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('owner_user_id')) {
      context.handle(
          _ownerUserIdMeta,
          ownerUserId.isAcceptableOrUnknown(
              data['owner_user_id']!, _ownerUserIdMeta));
    } else if (isInserting) {
      context.missing(_ownerUserIdMeta);
    }
    if (data.containsKey('scope_key')) {
      context.handle(_scopeKeyMeta,
          scopeKey.isAcceptableOrUnknown(data['scope_key']!, _scopeKeyMeta));
    } else if (isInserting) {
      context.missing(_scopeKeyMeta);
    }
    if (data.containsKey('last_sync_at_ms')) {
      context.handle(
          _lastSyncAtMsMeta,
          lastSyncAtMs.isAcceptableOrUnknown(
              data['last_sync_at_ms']!, _lastSyncAtMsMeta));
    } else if (isInserting) {
      context.missing(_lastSyncAtMsMeta);
    }
    if (data.containsKey('server_total')) {
      context.handle(
          _serverTotalMeta,
          serverTotal.isAcceptableOrUnknown(
              data['server_total']!, _serverTotalMeta));
    }
    if (data.containsKey('last_server_page')) {
      context.handle(
          _lastServerPageMeta,
          lastServerPage.isAcceptableOrUnknown(
              data['last_server_page']!, _lastServerPageMeta));
    }
    if (data.containsKey('last_page_size')) {
      context.handle(
          _lastPageSizeMeta,
          lastPageSize.isAcceptableOrUnknown(
              data['last_page_size']!, _lastPageSizeMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {ownerUserId, scopeKey};
  @override
  LibraryCacheMetaData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LibraryCacheMetaData(
      ownerUserId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}owner_user_id'])!,
      scopeKey: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}scope_key'])!,
      lastSyncAtMs: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}last_sync_at_ms'])!,
      serverTotal: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}server_total']),
      lastServerPage: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}last_server_page']),
      lastPageSize: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}last_page_size']),
    );
  }

  @override
  $LibraryCacheMetaTable createAlias(String alias) {
    return $LibraryCacheMetaTable(attachedDatabase, alias);
  }
}

class LibraryCacheMetaData extends DataClass
    implements Insertable<LibraryCacheMetaData> {
  final String ownerUserId;
  final String scopeKey;
  final int lastSyncAtMs;
  final int? serverTotal;
  final int? lastServerPage;
  final int? lastPageSize;
  const LibraryCacheMetaData(
      {required this.ownerUserId,
      required this.scopeKey,
      required this.lastSyncAtMs,
      this.serverTotal,
      this.lastServerPage,
      this.lastPageSize});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['owner_user_id'] = Variable<String>(ownerUserId);
    map['scope_key'] = Variable<String>(scopeKey);
    map['last_sync_at_ms'] = Variable<int>(lastSyncAtMs);
    if (!nullToAbsent || serverTotal != null) {
      map['server_total'] = Variable<int>(serverTotal);
    }
    if (!nullToAbsent || lastServerPage != null) {
      map['last_server_page'] = Variable<int>(lastServerPage);
    }
    if (!nullToAbsent || lastPageSize != null) {
      map['last_page_size'] = Variable<int>(lastPageSize);
    }
    return map;
  }

  LibraryCacheMetaCompanion toCompanion(bool nullToAbsent) {
    return LibraryCacheMetaCompanion(
      ownerUserId: Value(ownerUserId),
      scopeKey: Value(scopeKey),
      lastSyncAtMs: Value(lastSyncAtMs),
      serverTotal: serverTotal == null && nullToAbsent
          ? const Value.absent()
          : Value(serverTotal),
      lastServerPage: lastServerPage == null && nullToAbsent
          ? const Value.absent()
          : Value(lastServerPage),
      lastPageSize: lastPageSize == null && nullToAbsent
          ? const Value.absent()
          : Value(lastPageSize),
    );
  }

  factory LibraryCacheMetaData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LibraryCacheMetaData(
      ownerUserId: serializer.fromJson<String>(json['ownerUserId']),
      scopeKey: serializer.fromJson<String>(json['scopeKey']),
      lastSyncAtMs: serializer.fromJson<int>(json['lastSyncAtMs']),
      serverTotal: serializer.fromJson<int?>(json['serverTotal']),
      lastServerPage: serializer.fromJson<int?>(json['lastServerPage']),
      lastPageSize: serializer.fromJson<int?>(json['lastPageSize']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'ownerUserId': serializer.toJson<String>(ownerUserId),
      'scopeKey': serializer.toJson<String>(scopeKey),
      'lastSyncAtMs': serializer.toJson<int>(lastSyncAtMs),
      'serverTotal': serializer.toJson<int?>(serverTotal),
      'lastServerPage': serializer.toJson<int?>(lastServerPage),
      'lastPageSize': serializer.toJson<int?>(lastPageSize),
    };
  }

  LibraryCacheMetaData copyWith(
          {String? ownerUserId,
          String? scopeKey,
          int? lastSyncAtMs,
          Value<int?> serverTotal = const Value.absent(),
          Value<int?> lastServerPage = const Value.absent(),
          Value<int?> lastPageSize = const Value.absent()}) =>
      LibraryCacheMetaData(
        ownerUserId: ownerUserId ?? this.ownerUserId,
        scopeKey: scopeKey ?? this.scopeKey,
        lastSyncAtMs: lastSyncAtMs ?? this.lastSyncAtMs,
        serverTotal: serverTotal.present ? serverTotal.value : this.serverTotal,
        lastServerPage:
            lastServerPage.present ? lastServerPage.value : this.lastServerPage,
        lastPageSize:
            lastPageSize.present ? lastPageSize.value : this.lastPageSize,
      );
  LibraryCacheMetaData copyWithCompanion(LibraryCacheMetaCompanion data) {
    return LibraryCacheMetaData(
      ownerUserId:
          data.ownerUserId.present ? data.ownerUserId.value : this.ownerUserId,
      scopeKey: data.scopeKey.present ? data.scopeKey.value : this.scopeKey,
      lastSyncAtMs: data.lastSyncAtMs.present
          ? data.lastSyncAtMs.value
          : this.lastSyncAtMs,
      serverTotal:
          data.serverTotal.present ? data.serverTotal.value : this.serverTotal,
      lastServerPage: data.lastServerPage.present
          ? data.lastServerPage.value
          : this.lastServerPage,
      lastPageSize: data.lastPageSize.present
          ? data.lastPageSize.value
          : this.lastPageSize,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LibraryCacheMetaData(')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('scopeKey: $scopeKey, ')
          ..write('lastSyncAtMs: $lastSyncAtMs, ')
          ..write('serverTotal: $serverTotal, ')
          ..write('lastServerPage: $lastServerPage, ')
          ..write('lastPageSize: $lastPageSize')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(ownerUserId, scopeKey, lastSyncAtMs,
      serverTotal, lastServerPage, lastPageSize);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LibraryCacheMetaData &&
          other.ownerUserId == this.ownerUserId &&
          other.scopeKey == this.scopeKey &&
          other.lastSyncAtMs == this.lastSyncAtMs &&
          other.serverTotal == this.serverTotal &&
          other.lastServerPage == this.lastServerPage &&
          other.lastPageSize == this.lastPageSize);
}

class LibraryCacheMetaCompanion extends UpdateCompanion<LibraryCacheMetaData> {
  final Value<String> ownerUserId;
  final Value<String> scopeKey;
  final Value<int> lastSyncAtMs;
  final Value<int?> serverTotal;
  final Value<int?> lastServerPage;
  final Value<int?> lastPageSize;
  final Value<int> rowid;
  const LibraryCacheMetaCompanion({
    this.ownerUserId = const Value.absent(),
    this.scopeKey = const Value.absent(),
    this.lastSyncAtMs = const Value.absent(),
    this.serverTotal = const Value.absent(),
    this.lastServerPage = const Value.absent(),
    this.lastPageSize = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LibraryCacheMetaCompanion.insert({
    required String ownerUserId,
    required String scopeKey,
    required int lastSyncAtMs,
    this.serverTotal = const Value.absent(),
    this.lastServerPage = const Value.absent(),
    this.lastPageSize = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : ownerUserId = Value(ownerUserId),
        scopeKey = Value(scopeKey),
        lastSyncAtMs = Value(lastSyncAtMs);
  static Insertable<LibraryCacheMetaData> custom({
    Expression<String>? ownerUserId,
    Expression<String>? scopeKey,
    Expression<int>? lastSyncAtMs,
    Expression<int>? serverTotal,
    Expression<int>? lastServerPage,
    Expression<int>? lastPageSize,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (ownerUserId != null) 'owner_user_id': ownerUserId,
      if (scopeKey != null) 'scope_key': scopeKey,
      if (lastSyncAtMs != null) 'last_sync_at_ms': lastSyncAtMs,
      if (serverTotal != null) 'server_total': serverTotal,
      if (lastServerPage != null) 'last_server_page': lastServerPage,
      if (lastPageSize != null) 'last_page_size': lastPageSize,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LibraryCacheMetaCompanion copyWith(
      {Value<String>? ownerUserId,
      Value<String>? scopeKey,
      Value<int>? lastSyncAtMs,
      Value<int?>? serverTotal,
      Value<int?>? lastServerPage,
      Value<int?>? lastPageSize,
      Value<int>? rowid}) {
    return LibraryCacheMetaCompanion(
      ownerUserId: ownerUserId ?? this.ownerUserId,
      scopeKey: scopeKey ?? this.scopeKey,
      lastSyncAtMs: lastSyncAtMs ?? this.lastSyncAtMs,
      serverTotal: serverTotal ?? this.serverTotal,
      lastServerPage: lastServerPage ?? this.lastServerPage,
      lastPageSize: lastPageSize ?? this.lastPageSize,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (ownerUserId.present) {
      map['owner_user_id'] = Variable<String>(ownerUserId.value);
    }
    if (scopeKey.present) {
      map['scope_key'] = Variable<String>(scopeKey.value);
    }
    if (lastSyncAtMs.present) {
      map['last_sync_at_ms'] = Variable<int>(lastSyncAtMs.value);
    }
    if (serverTotal.present) {
      map['server_total'] = Variable<int>(serverTotal.value);
    }
    if (lastServerPage.present) {
      map['last_server_page'] = Variable<int>(lastServerPage.value);
    }
    if (lastPageSize.present) {
      map['last_page_size'] = Variable<int>(lastPageSize.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LibraryCacheMetaCompanion(')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('scopeKey: $scopeKey, ')
          ..write('lastSyncAtMs: $lastSyncAtMs, ')
          ..write('serverTotal: $serverTotal, ')
          ..write('lastServerPage: $lastServerPage, ')
          ..write('lastPageSize: $lastPageSize, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncOutboxEntriesTable extends SyncOutboxEntries
    with TableInfo<$SyncOutboxEntriesTable, SyncOutboxEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncOutboxEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _ownerUserIdMeta =
      const VerificationMeta('ownerUserId');
  @override
  late final GeneratedColumn<String> ownerUserId = GeneratedColumn<String>(
      'owner_user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _clientMutationIdMeta =
      const VerificationMeta('clientMutationId');
  @override
  late final GeneratedColumn<String> clientMutationId = GeneratedColumn<String>(
      'client_mutation_id', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _createdAtMsMeta =
      const VerificationMeta('createdAtMs');
  @override
  late final GeneratedColumn<int> createdAtMs = GeneratedColumn<int>(
      'created_at_ms', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        ownerUserId,
        operation,
        payloadJson,
        clientMutationId,
        status,
        createdAtMs
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_outbox_entries';
  @override
  VerificationContext validateIntegrity(Insertable<SyncOutboxEntry> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('owner_user_id')) {
      context.handle(
          _ownerUserIdMeta,
          ownerUserId.isAcceptableOrUnknown(
              data['owner_user_id']!, _ownerUserIdMeta));
    } else if (isInserting) {
      context.missing(_ownerUserIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('client_mutation_id')) {
      context.handle(
          _clientMutationIdMeta,
          clientMutationId.isAcceptableOrUnknown(
              data['client_mutation_id']!, _clientMutationIdMeta));
    } else if (isInserting) {
      context.missing(_clientMutationIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('created_at_ms')) {
      context.handle(
          _createdAtMsMeta,
          createdAtMs.isAcceptableOrUnknown(
              data['created_at_ms']!, _createdAtMsMeta));
    } else if (isInserting) {
      context.missing(_createdAtMsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncOutboxEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncOutboxEntry(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      ownerUserId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}owner_user_id'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      clientMutationId: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}client_mutation_id'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      createdAtMs: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}created_at_ms'])!,
    );
  }

  @override
  $SyncOutboxEntriesTable createAlias(String alias) {
    return $SyncOutboxEntriesTable(attachedDatabase, alias);
  }
}

class SyncOutboxEntry extends DataClass implements Insertable<SyncOutboxEntry> {
  final int id;
  final String ownerUserId;
  final String operation;
  final String payloadJson;
  final String clientMutationId;
  final String status;
  final int createdAtMs;
  const SyncOutboxEntry(
      {required this.id,
      required this.ownerUserId,
      required this.operation,
      required this.payloadJson,
      required this.clientMutationId,
      required this.status,
      required this.createdAtMs});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['owner_user_id'] = Variable<String>(ownerUserId);
    map['operation'] = Variable<String>(operation);
    map['payload_json'] = Variable<String>(payloadJson);
    map['client_mutation_id'] = Variable<String>(clientMutationId);
    map['status'] = Variable<String>(status);
    map['created_at_ms'] = Variable<int>(createdAtMs);
    return map;
  }

  SyncOutboxEntriesCompanion toCompanion(bool nullToAbsent) {
    return SyncOutboxEntriesCompanion(
      id: Value(id),
      ownerUserId: Value(ownerUserId),
      operation: Value(operation),
      payloadJson: Value(payloadJson),
      clientMutationId: Value(clientMutationId),
      status: Value(status),
      createdAtMs: Value(createdAtMs),
    );
  }

  factory SyncOutboxEntry.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncOutboxEntry(
      id: serializer.fromJson<int>(json['id']),
      ownerUserId: serializer.fromJson<String>(json['ownerUserId']),
      operation: serializer.fromJson<String>(json['operation']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      clientMutationId: serializer.fromJson<String>(json['clientMutationId']),
      status: serializer.fromJson<String>(json['status']),
      createdAtMs: serializer.fromJson<int>(json['createdAtMs']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'ownerUserId': serializer.toJson<String>(ownerUserId),
      'operation': serializer.toJson<String>(operation),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'clientMutationId': serializer.toJson<String>(clientMutationId),
      'status': serializer.toJson<String>(status),
      'createdAtMs': serializer.toJson<int>(createdAtMs),
    };
  }

  SyncOutboxEntry copyWith(
          {int? id,
          String? ownerUserId,
          String? operation,
          String? payloadJson,
          String? clientMutationId,
          String? status,
          int? createdAtMs}) =>
      SyncOutboxEntry(
        id: id ?? this.id,
        ownerUserId: ownerUserId ?? this.ownerUserId,
        operation: operation ?? this.operation,
        payloadJson: payloadJson ?? this.payloadJson,
        clientMutationId: clientMutationId ?? this.clientMutationId,
        status: status ?? this.status,
        createdAtMs: createdAtMs ?? this.createdAtMs,
      );
  SyncOutboxEntry copyWithCompanion(SyncOutboxEntriesCompanion data) {
    return SyncOutboxEntry(
      id: data.id.present ? data.id.value : this.id,
      ownerUserId:
          data.ownerUserId.present ? data.ownerUserId.value : this.ownerUserId,
      operation: data.operation.present ? data.operation.value : this.operation,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      clientMutationId: data.clientMutationId.present
          ? data.clientMutationId.value
          : this.clientMutationId,
      status: data.status.present ? data.status.value : this.status,
      createdAtMs:
          data.createdAtMs.present ? data.createdAtMs.value : this.createdAtMs,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxEntry(')
          ..write('id: $id, ')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('operation: $operation, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('clientMutationId: $clientMutationId, ')
          ..write('status: $status, ')
          ..write('createdAtMs: $createdAtMs')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, ownerUserId, operation, payloadJson,
      clientMutationId, status, createdAtMs);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncOutboxEntry &&
          other.id == this.id &&
          other.ownerUserId == this.ownerUserId &&
          other.operation == this.operation &&
          other.payloadJson == this.payloadJson &&
          other.clientMutationId == this.clientMutationId &&
          other.status == this.status &&
          other.createdAtMs == this.createdAtMs);
}

class SyncOutboxEntriesCompanion extends UpdateCompanion<SyncOutboxEntry> {
  final Value<int> id;
  final Value<String> ownerUserId;
  final Value<String> operation;
  final Value<String> payloadJson;
  final Value<String> clientMutationId;
  final Value<String> status;
  final Value<int> createdAtMs;
  const SyncOutboxEntriesCompanion({
    this.id = const Value.absent(),
    this.ownerUserId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.clientMutationId = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAtMs = const Value.absent(),
  });
  SyncOutboxEntriesCompanion.insert({
    this.id = const Value.absent(),
    required String ownerUserId,
    required String operation,
    required String payloadJson,
    required String clientMutationId,
    this.status = const Value.absent(),
    required int createdAtMs,
  })  : ownerUserId = Value(ownerUserId),
        operation = Value(operation),
        payloadJson = Value(payloadJson),
        clientMutationId = Value(clientMutationId),
        createdAtMs = Value(createdAtMs);
  static Insertable<SyncOutboxEntry> custom({
    Expression<int>? id,
    Expression<String>? ownerUserId,
    Expression<String>? operation,
    Expression<String>? payloadJson,
    Expression<String>? clientMutationId,
    Expression<String>? status,
    Expression<int>? createdAtMs,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (ownerUserId != null) 'owner_user_id': ownerUserId,
      if (operation != null) 'operation': operation,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (clientMutationId != null) 'client_mutation_id': clientMutationId,
      if (status != null) 'status': status,
      if (createdAtMs != null) 'created_at_ms': createdAtMs,
    });
  }

  SyncOutboxEntriesCompanion copyWith(
      {Value<int>? id,
      Value<String>? ownerUserId,
      Value<String>? operation,
      Value<String>? payloadJson,
      Value<String>? clientMutationId,
      Value<String>? status,
      Value<int>? createdAtMs}) {
    return SyncOutboxEntriesCompanion(
      id: id ?? this.id,
      ownerUserId: ownerUserId ?? this.ownerUserId,
      operation: operation ?? this.operation,
      payloadJson: payloadJson ?? this.payloadJson,
      clientMutationId: clientMutationId ?? this.clientMutationId,
      status: status ?? this.status,
      createdAtMs: createdAtMs ?? this.createdAtMs,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (ownerUserId.present) {
      map['owner_user_id'] = Variable<String>(ownerUserId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (clientMutationId.present) {
      map['client_mutation_id'] = Variable<String>(clientMutationId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAtMs.present) {
      map['created_at_ms'] = Variable<int>(createdAtMs.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxEntriesCompanion(')
          ..write('id: $id, ')
          ..write('ownerUserId: $ownerUserId, ')
          ..write('operation: $operation, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('clientMutationId: $clientMutationId, ')
          ..write('status: $status, ')
          ..write('createdAtMs: $createdAtMs')
          ..write(')'))
        .toString();
  }
}

abstract class _$LibraryOfflineDatabase extends GeneratedDatabase {
  _$LibraryOfflineDatabase(QueryExecutor e) : super(e);
  $LibraryOfflineDatabaseManager get managers =>
      $LibraryOfflineDatabaseManager(this);
  late final $CachedUserBooksTable cachedUserBooks =
      $CachedUserBooksTable(this);
  late final $LibraryCacheMetaTable libraryCacheMeta =
      $LibraryCacheMetaTable(this);
  late final $SyncOutboxEntriesTable syncOutboxEntries =
      $SyncOutboxEntriesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [cachedUserBooks, libraryCacheMeta, syncOutboxEntries];
}

typedef $$CachedUserBooksTableCreateCompanionBuilder = CachedUserBooksCompanion
    Function({
  required String ownerUserId,
  required String userBookId,
  required String payloadJson,
  required int cachedAtMs,
  Value<int> rowid,
});
typedef $$CachedUserBooksTableUpdateCompanionBuilder = CachedUserBooksCompanion
    Function({
  Value<String> ownerUserId,
  Value<String> userBookId,
  Value<String> payloadJson,
  Value<int> cachedAtMs,
  Value<int> rowid,
});

class $$CachedUserBooksTableFilterComposer
    extends Composer<_$LibraryOfflineDatabase, $CachedUserBooksTable> {
  $$CachedUserBooksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userBookId => $composableBuilder(
      column: $table.userBookId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get cachedAtMs => $composableBuilder(
      column: $table.cachedAtMs, builder: (column) => ColumnFilters(column));
}

class $$CachedUserBooksTableOrderingComposer
    extends Composer<_$LibraryOfflineDatabase, $CachedUserBooksTable> {
  $$CachedUserBooksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userBookId => $composableBuilder(
      column: $table.userBookId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get cachedAtMs => $composableBuilder(
      column: $table.cachedAtMs, builder: (column) => ColumnOrderings(column));
}

class $$CachedUserBooksTableAnnotationComposer
    extends Composer<_$LibraryOfflineDatabase, $CachedUserBooksTable> {
  $$CachedUserBooksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => column);

  GeneratedColumn<String> get userBookId => $composableBuilder(
      column: $table.userBookId, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<int> get cachedAtMs => $composableBuilder(
      column: $table.cachedAtMs, builder: (column) => column);
}

class $$CachedUserBooksTableTableManager extends RootTableManager<
    _$LibraryOfflineDatabase,
    $CachedUserBooksTable,
    CachedUserBook,
    $$CachedUserBooksTableFilterComposer,
    $$CachedUserBooksTableOrderingComposer,
    $$CachedUserBooksTableAnnotationComposer,
    $$CachedUserBooksTableCreateCompanionBuilder,
    $$CachedUserBooksTableUpdateCompanionBuilder,
    (
      CachedUserBook,
      BaseReferences<_$LibraryOfflineDatabase, $CachedUserBooksTable,
          CachedUserBook>
    ),
    CachedUserBook,
    PrefetchHooks Function()> {
  $$CachedUserBooksTableTableManager(
      _$LibraryOfflineDatabase db, $CachedUserBooksTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedUserBooksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedUserBooksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedUserBooksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> ownerUserId = const Value.absent(),
            Value<String> userBookId = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<int> cachedAtMs = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedUserBooksCompanion(
            ownerUserId: ownerUserId,
            userBookId: userBookId,
            payloadJson: payloadJson,
            cachedAtMs: cachedAtMs,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String ownerUserId,
            required String userBookId,
            required String payloadJson,
            required int cachedAtMs,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedUserBooksCompanion.insert(
            ownerUserId: ownerUserId,
            userBookId: userBookId,
            payloadJson: payloadJson,
            cachedAtMs: cachedAtMs,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedUserBooksTableProcessedTableManager = ProcessedTableManager<
    _$LibraryOfflineDatabase,
    $CachedUserBooksTable,
    CachedUserBook,
    $$CachedUserBooksTableFilterComposer,
    $$CachedUserBooksTableOrderingComposer,
    $$CachedUserBooksTableAnnotationComposer,
    $$CachedUserBooksTableCreateCompanionBuilder,
    $$CachedUserBooksTableUpdateCompanionBuilder,
    (
      CachedUserBook,
      BaseReferences<_$LibraryOfflineDatabase, $CachedUserBooksTable,
          CachedUserBook>
    ),
    CachedUserBook,
    PrefetchHooks Function()>;
typedef $$LibraryCacheMetaTableCreateCompanionBuilder
    = LibraryCacheMetaCompanion Function({
  required String ownerUserId,
  required String scopeKey,
  required int lastSyncAtMs,
  Value<int?> serverTotal,
  Value<int?> lastServerPage,
  Value<int?> lastPageSize,
  Value<int> rowid,
});
typedef $$LibraryCacheMetaTableUpdateCompanionBuilder
    = LibraryCacheMetaCompanion Function({
  Value<String> ownerUserId,
  Value<String> scopeKey,
  Value<int> lastSyncAtMs,
  Value<int?> serverTotal,
  Value<int?> lastServerPage,
  Value<int?> lastPageSize,
  Value<int> rowid,
});

class $$LibraryCacheMetaTableFilterComposer
    extends Composer<_$LibraryOfflineDatabase, $LibraryCacheMetaTable> {
  $$LibraryCacheMetaTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get scopeKey => $composableBuilder(
      column: $table.scopeKey, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get lastSyncAtMs => $composableBuilder(
      column: $table.lastSyncAtMs, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get serverTotal => $composableBuilder(
      column: $table.serverTotal, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get lastServerPage => $composableBuilder(
      column: $table.lastServerPage,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get lastPageSize => $composableBuilder(
      column: $table.lastPageSize, builder: (column) => ColumnFilters(column));
}

class $$LibraryCacheMetaTableOrderingComposer
    extends Composer<_$LibraryOfflineDatabase, $LibraryCacheMetaTable> {
  $$LibraryCacheMetaTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get scopeKey => $composableBuilder(
      column: $table.scopeKey, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get lastSyncAtMs => $composableBuilder(
      column: $table.lastSyncAtMs,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get serverTotal => $composableBuilder(
      column: $table.serverTotal, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get lastServerPage => $composableBuilder(
      column: $table.lastServerPage,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get lastPageSize => $composableBuilder(
      column: $table.lastPageSize,
      builder: (column) => ColumnOrderings(column));
}

class $$LibraryCacheMetaTableAnnotationComposer
    extends Composer<_$LibraryOfflineDatabase, $LibraryCacheMetaTable> {
  $$LibraryCacheMetaTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => column);

  GeneratedColumn<String> get scopeKey =>
      $composableBuilder(column: $table.scopeKey, builder: (column) => column);

  GeneratedColumn<int> get lastSyncAtMs => $composableBuilder(
      column: $table.lastSyncAtMs, builder: (column) => column);

  GeneratedColumn<int> get serverTotal => $composableBuilder(
      column: $table.serverTotal, builder: (column) => column);

  GeneratedColumn<int> get lastServerPage => $composableBuilder(
      column: $table.lastServerPage, builder: (column) => column);

  GeneratedColumn<int> get lastPageSize => $composableBuilder(
      column: $table.lastPageSize, builder: (column) => column);
}

class $$LibraryCacheMetaTableTableManager extends RootTableManager<
    _$LibraryOfflineDatabase,
    $LibraryCacheMetaTable,
    LibraryCacheMetaData,
    $$LibraryCacheMetaTableFilterComposer,
    $$LibraryCacheMetaTableOrderingComposer,
    $$LibraryCacheMetaTableAnnotationComposer,
    $$LibraryCacheMetaTableCreateCompanionBuilder,
    $$LibraryCacheMetaTableUpdateCompanionBuilder,
    (
      LibraryCacheMetaData,
      BaseReferences<_$LibraryOfflineDatabase, $LibraryCacheMetaTable,
          LibraryCacheMetaData>
    ),
    LibraryCacheMetaData,
    PrefetchHooks Function()> {
  $$LibraryCacheMetaTableTableManager(
      _$LibraryOfflineDatabase db, $LibraryCacheMetaTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LibraryCacheMetaTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LibraryCacheMetaTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LibraryCacheMetaTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> ownerUserId = const Value.absent(),
            Value<String> scopeKey = const Value.absent(),
            Value<int> lastSyncAtMs = const Value.absent(),
            Value<int?> serverTotal = const Value.absent(),
            Value<int?> lastServerPage = const Value.absent(),
            Value<int?> lastPageSize = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LibraryCacheMetaCompanion(
            ownerUserId: ownerUserId,
            scopeKey: scopeKey,
            lastSyncAtMs: lastSyncAtMs,
            serverTotal: serverTotal,
            lastServerPage: lastServerPage,
            lastPageSize: lastPageSize,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String ownerUserId,
            required String scopeKey,
            required int lastSyncAtMs,
            Value<int?> serverTotal = const Value.absent(),
            Value<int?> lastServerPage = const Value.absent(),
            Value<int?> lastPageSize = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LibraryCacheMetaCompanion.insert(
            ownerUserId: ownerUserId,
            scopeKey: scopeKey,
            lastSyncAtMs: lastSyncAtMs,
            serverTotal: serverTotal,
            lastServerPage: lastServerPage,
            lastPageSize: lastPageSize,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LibraryCacheMetaTableProcessedTableManager = ProcessedTableManager<
    _$LibraryOfflineDatabase,
    $LibraryCacheMetaTable,
    LibraryCacheMetaData,
    $$LibraryCacheMetaTableFilterComposer,
    $$LibraryCacheMetaTableOrderingComposer,
    $$LibraryCacheMetaTableAnnotationComposer,
    $$LibraryCacheMetaTableCreateCompanionBuilder,
    $$LibraryCacheMetaTableUpdateCompanionBuilder,
    (
      LibraryCacheMetaData,
      BaseReferences<_$LibraryOfflineDatabase, $LibraryCacheMetaTable,
          LibraryCacheMetaData>
    ),
    LibraryCacheMetaData,
    PrefetchHooks Function()>;
typedef $$SyncOutboxEntriesTableCreateCompanionBuilder
    = SyncOutboxEntriesCompanion Function({
  Value<int> id,
  required String ownerUserId,
  required String operation,
  required String payloadJson,
  required String clientMutationId,
  Value<String> status,
  required int createdAtMs,
});
typedef $$SyncOutboxEntriesTableUpdateCompanionBuilder
    = SyncOutboxEntriesCompanion Function({
  Value<int> id,
  Value<String> ownerUserId,
  Value<String> operation,
  Value<String> payloadJson,
  Value<String> clientMutationId,
  Value<String> status,
  Value<int> createdAtMs,
});

class $$SyncOutboxEntriesTableFilterComposer
    extends Composer<_$LibraryOfflineDatabase, $SyncOutboxEntriesTable> {
  $$SyncOutboxEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientMutationId => $composableBuilder(
      column: $table.clientMutationId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get createdAtMs => $composableBuilder(
      column: $table.createdAtMs, builder: (column) => ColumnFilters(column));
}

class $$SyncOutboxEntriesTableOrderingComposer
    extends Composer<_$LibraryOfflineDatabase, $SyncOutboxEntriesTable> {
  $$SyncOutboxEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientMutationId => $composableBuilder(
      column: $table.clientMutationId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get createdAtMs => $composableBuilder(
      column: $table.createdAtMs, builder: (column) => ColumnOrderings(column));
}

class $$SyncOutboxEntriesTableAnnotationComposer
    extends Composer<_$LibraryOfflineDatabase, $SyncOutboxEntriesTable> {
  $$SyncOutboxEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get ownerUserId => $composableBuilder(
      column: $table.ownerUserId, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<String> get clientMutationId => $composableBuilder(
      column: $table.clientMutationId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get createdAtMs => $composableBuilder(
      column: $table.createdAtMs, builder: (column) => column);
}

class $$SyncOutboxEntriesTableTableManager extends RootTableManager<
    _$LibraryOfflineDatabase,
    $SyncOutboxEntriesTable,
    SyncOutboxEntry,
    $$SyncOutboxEntriesTableFilterComposer,
    $$SyncOutboxEntriesTableOrderingComposer,
    $$SyncOutboxEntriesTableAnnotationComposer,
    $$SyncOutboxEntriesTableCreateCompanionBuilder,
    $$SyncOutboxEntriesTableUpdateCompanionBuilder,
    (
      SyncOutboxEntry,
      BaseReferences<_$LibraryOfflineDatabase, $SyncOutboxEntriesTable,
          SyncOutboxEntry>
    ),
    SyncOutboxEntry,
    PrefetchHooks Function()> {
  $$SyncOutboxEntriesTableTableManager(
      _$LibraryOfflineDatabase db, $SyncOutboxEntriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncOutboxEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncOutboxEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncOutboxEntriesTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> ownerUserId = const Value.absent(),
            Value<String> operation = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<String> clientMutationId = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> createdAtMs = const Value.absent(),
          }) =>
              SyncOutboxEntriesCompanion(
            id: id,
            ownerUserId: ownerUserId,
            operation: operation,
            payloadJson: payloadJson,
            clientMutationId: clientMutationId,
            status: status,
            createdAtMs: createdAtMs,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String ownerUserId,
            required String operation,
            required String payloadJson,
            required String clientMutationId,
            Value<String> status = const Value.absent(),
            required int createdAtMs,
          }) =>
              SyncOutboxEntriesCompanion.insert(
            id: id,
            ownerUserId: ownerUserId,
            operation: operation,
            payloadJson: payloadJson,
            clientMutationId: clientMutationId,
            status: status,
            createdAtMs: createdAtMs,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncOutboxEntriesTableProcessedTableManager = ProcessedTableManager<
    _$LibraryOfflineDatabase,
    $SyncOutboxEntriesTable,
    SyncOutboxEntry,
    $$SyncOutboxEntriesTableFilterComposer,
    $$SyncOutboxEntriesTableOrderingComposer,
    $$SyncOutboxEntriesTableAnnotationComposer,
    $$SyncOutboxEntriesTableCreateCompanionBuilder,
    $$SyncOutboxEntriesTableUpdateCompanionBuilder,
    (
      SyncOutboxEntry,
      BaseReferences<_$LibraryOfflineDatabase, $SyncOutboxEntriesTable,
          SyncOutboxEntry>
    ),
    SyncOutboxEntry,
    PrefetchHooks Function()>;

class $LibraryOfflineDatabaseManager {
  final _$LibraryOfflineDatabase _db;
  $LibraryOfflineDatabaseManager(this._db);
  $$CachedUserBooksTableTableManager get cachedUserBooks =>
      $$CachedUserBooksTableTableManager(_db, _db.cachedUserBooks);
  $$LibraryCacheMetaTableTableManager get libraryCacheMeta =>
      $$LibraryCacheMetaTableTableManager(_db, _db.libraryCacheMeta);
  $$SyncOutboxEntriesTableTableManager get syncOutboxEntries =>
      $$SyncOutboxEntriesTableTableManager(_db, _db.syncOutboxEntries);
}
