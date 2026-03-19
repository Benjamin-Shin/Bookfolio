import 'package:bookfolio_mobile/src/models/book_models.dart';
import 'package:bookfolio_mobile/src/state/library_controller.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

class BarcodeScanScreen extends StatefulWidget {
  const BarcodeScanScreen({super.key});

  @override
  State<BarcodeScanScreen> createState() => _BarcodeScanScreenState();
}

class _BarcodeScanScreenState extends State<BarcodeScanScreen> {
  bool _isResolving = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final library = context.read<LibraryController>();

    return Scaffold(
      appBar: AppBar(title: const Text('ISBN 바코드 스캔')),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (capture) async {
              if (_isResolving) return;
              final barcode = capture.barcodes.firstOrNull?.rawValue;
              if (barcode == null) return;

              setState(() {
                _isResolving = true;
                _error = null;
              });

              try {
                final lookup = await library.lookupByIsbn(barcode);
                if (mounted) Navigator.of(context).pop(lookup);
              } catch (error) {
                setState(() => _error = '조회에 실패했습니다. 수동 입력으로 이어가주세요.');
              } finally {
                if (mounted) {
                  setState(() => _isResolving = false);
                }
              }
            },
          ),
          if (_error != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(_error!),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

