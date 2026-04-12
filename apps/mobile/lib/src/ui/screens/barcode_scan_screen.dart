import 'package:seogadam_mobile/src/state/library_controller.dart';
import 'package:seogadam_mobile/src/util/isbn.dart';
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
  final MobileScannerController _scanner = MobileScannerController(
    formats: [BarcodeFormat.ean13, BarcodeFormat.ean8, BarcodeFormat.code128],
  );

  @override
  void dispose() {
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _onBarcode(String? raw) async {
    if (_isResolving || raw == null) return;

    final normalized = normalizeIsbnInput(raw);
    if (normalized == null || !isPlausibleIsbn(normalized)) {
      setState(() {
        _error = 'ISBN으로 보이지 않는 코드입니다. 책 뒷면 EAN 바코드를 스캔해 주세요.';
      });
      return;
    }

    setState(() {
      _isResolving = true;
      _error = null;
    });

    try {
      final library = context.read<LibraryController>();
      final lookup = await library.lookupByIsbn(normalized);
      if (mounted) Navigator.of(context).pop(lookup);
    } catch (error) {
      setState(() {
        _error = '도서 정보를 가져오지 못했습니다. ISBN을 수동 입력한 뒤 「도서 정보 불러오기」를 눌러 보세요.';
      });
    } finally {
      if (mounted) {
        setState(() => _isResolving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ISBN 바코드 스캔'),
        actions: [
          IconButton(
            tooltip: '플래시',
            onPressed: () => _scanner.toggleTorch(),
            icon: ValueListenableBuilder(
              valueListenable: _scanner,
              builder: (context, state, _) {
                return Icon(state.torchState == TorchState.on ? Icons.flash_on : Icons.flash_off);
              },
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scanner,
            onDetect: (capture) {
              final barcode = capture.barcodes.firstOrNull?.rawValue;
              _onBarcode(barcode);
            },
          ),
          Align(
            alignment: Alignment.center,
            child: IgnorePointer(
              child: Container(
                width: 280,
                height: 140,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white70, width: 2),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          if (_isResolving)
            const ColoredBox(
              color: Color(0x66000000),
              child: Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 12),
                        Text('도서 정보를 불러오는 중…'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (_error != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    _error!,
                    style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
