import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Play 릴리스 서명: android/key.properties + storeFile (app 기준 상대 경로). 없으면 debug 서명.
// @history 2026-04-01: key.properties 연동

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // Dart 패키지명 `seogadam_mobile`과 정렬(앱 표시명은 strings.xml `서가담`).
    // @history 2026-04-12: `app.seogadam.mobile` — 기존 `com.example.bookfolio_mobile` 대체
    namespace = "app.seogadam.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "app.bookfolio.android"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storePassword = keystoreProperties.getProperty("storePassword")
                storeFile = file(keystoreProperties.getProperty("storeFile")!!)
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName(
                if (keystorePropertiesFile.exists()) "release" else "debug",
            )
        }
    }
}

flutter {
    source = "../.."
}

/**
 * ML Kit: `google_mlkit_text_recognition`은 일부 스크립트 팩을 compileOnly로 두어,
 * 앱 쪽에서 implementation으로 넣지 않으면 R8이 Missing class로 릴리스 빌드를 실패시킬 수 있음.
 *
 * @history
 * - 2026-03-27: chinese/devanagari/japanese implementation 추가 (minifyReleaseWithR8)
 */
dependencies {
    implementation("com.google.mlkit:text-recognition-chinese:16.0.1")
    implementation("com.google.mlkit:text-recognition-devanagari:16.0.1")
    implementation("com.google.mlkit:text-recognition-japanese:16.0.1")
    implementation("com.google.mlkit:text-recognition-korean:16.0.1")
}
