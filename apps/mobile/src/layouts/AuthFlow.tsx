import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OnboardingIntroScreen } from '../screens/OnboardingIntroScreen';
import { EmailEntryScreen } from '../screens/EmailEntryScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';

type Step = 'intro' | 'email' | 'otp';

/**
 * Sign-in — Screens 19, 20, 21.
 *
 * Sibling to `MainLayout`, and the same shape: a step decides which screen renders. It
 * replaces `MainLayout` rather than sitting over it, because `MainLayout` always draws the
 * floating tab pill and it would hang over the onboarding screens.
 *
 * `step` and the typed address stay local. Nothing outside the flow reads either — the same
 * reasoning that keeps the pending detection inside `CameraDetectionScreen`
 * (`docs/DESIGN.md` §5). Only the resulting session is promoted to shared state, and the
 * screen that earns it calls `completeSignIn` directly: `App.tsx` gates on the session, so
 * there is no "done" step here and no success screen to leave behind.
 */
export function AuthFlow() {
  const [step, setStep] = useState<Step>('intro');
  const [email, setEmail] = useState('');
  const [devCode, setDevCode] = useState('');

  /**
   * Android hardware back walks the flow backwards. `BackHandler` rather than a Modal's
   * `onRequestClose`, since these are plain screens — the same trade the camera result
   * sheet makes. Returning false on the intro lets back background the app, which is what
   * a first screen should do.
   */
  const goBack = useCallback((): boolean => {
    if (step === 'otp') {
      setStep('email');
      return true;
    }
    if (step === 'email') {
      setStep('intro');
      return true;
    }
    return false;
  }, [step]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [goBack]);

  return (
    <View style={styles.container}>
      {step === 'intro' && <OnboardingIntroScreen onStart={() => setStep('email')} />}

      {step === 'email' && (
        <EmailEntryScreen
          email={email}
          onEmailChange={setEmail}
          onBack={() => setStep('intro')}
          onCodeSent={(code) => {
            setDevCode(code);
            setStep('otp');
          }}
        />
      )}

      {step === 'otp' && (
        <OtpVerificationScreen
          email={email}
          devCode={devCode}
          onBack={() => setStep('email')}
          onChangeEmail={() => setStep('email')}
        />
      )}

      {/* Owned here rather than in `App.tsx`, which would then have to know this flow's
          internal step. Lifting `step` into context purely to pick a status-bar style
          would leak flow state for no other reader. */}
      <StatusBar style={step === 'intro' ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
