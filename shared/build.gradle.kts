plugins {
    kotlin("multiplatform")
//    kotlin("native.cocoapods")
    id("com.android.library")
    id("com.google.devtools.ksp")
    id("maven-publish")
}

repositories {
    google()
    mavenCentral()
    mavenLocal()
}

val KEY_PAGE_NAME = "pageName"

kotlin {
    android {
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
        publishLibraryVariants("release")
    }

//    iosX64()
//    iosArm64()
//    iosSimulatorArm64()
//
//    cocoapods {
//        summary = "Some description for the Shared Module"
//        homepage = "Link to the Shared Module homepage"
//        version = "1.0"
//        ios.deploymentTarget = "14.1"
//        podfile = project.file("../iosApp/Podfile")
//        framework {
//            baseName = "shared"
//            freeCompilerArgs = freeCompilerArgs + getCommonCompilerArgs()
//            isStatic = true
//            license = "MIT"
//        }
//        extraSpecAttributes["resources"] = "['src/commonMain/assets/**']"
//    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("com.tencent.kuikly-open:core:2.0.0-1.9.22")
                implementation("com.tencent.kuikly-open:core-annotations:2.0.0-1.9.22")

            }
        }
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
            }
        }
        val androidMain by getting {
            dependencies {
                api("com.tencent.kuikly-open:core-render-android:2.0.0-1.9.22")
            }
        }

//        val iosX64Main by getting
//        val iosArm64Main by getting
//        val iosSimulatorArm64Main by getting
//        val iosMain by creating {
//            dependsOn(commonMain)
//            iosX64Main.dependsOn(this)
//            iosArm64Main.dependsOn(this)
//            iosSimulatorArm64Main.dependsOn(this)
//        }
//        val iosX64Test by getting
//        val iosArm64Test by getting
//        val iosSimulatorArm64Test by getting
//        val iosTest by creating {
//            dependsOn(commonTest)
//            iosX64Test.dependsOn(this)
//            iosArm64Test.dependsOn(this)
//            iosSimulatorArm64Test.dependsOn(this)
//        }
    }
}

group = "com.example.kuiklydemo"
version = System.getenv("kuiklyBizVersion") ?: "1.0.0"

publishing {
    repositories {
        maven {
            credentials {
                username = System.getenv("mavenUserName") ?: ""
                password = System.getenv("mavenPassword") ?: ""
            }
            url = uri(rootProject.properties["mavenUrl"] as? String ?: "")
        }
    }
}

ksp {
    arg(KEY_PAGE_NAME, getPageName())
}

dependencies {
    compileOnly("com.tencent.kuikly-open:core-ksp:2.0.0-1.9.22") {
        add("kspAndroid", this)
//        add("kspIosArm64", this)
//        add("kspIosX64", this)
//        add("kspIosSimulatorArm64", this)
    }
}

android {
    namespace = "com.example.kuiklydemo.shared"
    compileSdk = 30
    defaultConfig {
        minSdk = 21
        targetSdk = 30
    }
    sourceSets {
        named("main") {
            assets.srcDirs("src/commonMain/assets")
        }
    }
}

fun getPageName(): String {
    return (project.properties[KEY_PAGE_NAME] as? String) ?: ""
}

fun getCommonCompilerArgs(): List<String> {
    return listOf(
        "-Xallocator=std"
    )
}

fun getLinkerArgs(): List<String> {
    return listOf()
}