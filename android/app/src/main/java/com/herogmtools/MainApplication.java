package com.herogmtools;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.clipsub.RNShake.RNShakeEventPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import org.wonday.pdf.RCTPdfView;
import com.reactnativedocumentpicker.ReactNativeDocumentPicker;
import org.wonday.pdf.RCTPdfView;
import com.RNFetchBlob.RNFetchBlobPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.horcrux.svg.SvgPackage;
import com.reactnativedocumentpicker.ReactNativeDocumentPicker;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNShakeEventPackage(),
            new RNFetchBlobPackage(),
            new RCTPdfView(),
            new SplashScreenReactPackage(),
            new SvgPackage(),
            new ReactNativeDocumentPicker()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
