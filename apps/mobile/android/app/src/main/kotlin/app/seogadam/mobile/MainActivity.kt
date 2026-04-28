package app.seogadam.mobile

import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity

/**
 * Android 진입 Activity.
 *
 * @history
 * - 2026-04-29: Android 15 edge-to-edge 기본 동작 대응을 위해 decor fits system windows를 비활성화
 */
class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }
}
