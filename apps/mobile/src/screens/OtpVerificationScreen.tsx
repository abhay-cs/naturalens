import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BorderRadii, Colors, Spacing, Typography } from '../theme/tokens';
import { OTP_BOX_HEIGHT } from '../theme/layout';
import { AuthScaffold } from '../components/AuthScaffold';
import { Button } from '../components/Button';
import { FieldError } from '../components/FieldError';
import { useAppState } from '../contexts/AppStateContext';
import { AuthError, OTP_LENGTH, requestCode, verifyCode } from '../lib/auth';

/** How long before a new code can be asked for. Long enough to let the first one arrive. */
const RESEND_COOLDOWN_S = 30;

interface OtpVerificationScreenProps {
  email: string;
  /** The stub's code, shown under `__DEV__` only — see `lib/auth.ts`. */
  devCode: string;
  onBack: () => void;
  onChangeEmail: () => void;
}

/**
 * Screen 21 — six digits.
 *
 * The boxes are drawn; the input is one hidden `TextInput` stretched across them. Six real
 * inputs is the obvious build and the wrong one: they fight one-time-code autofill, which
 * arrives as a single six-character paste, and backspace across a boundary has to be
 * emulated by hand from key events. One input gets both for free, and the boxes become
 * what they actually are — a readout.
 *
 * It submits itself on the sixth digit. The pill stays because a rejected code needs a way
 * back in without deleting a digit first, and because the screen should have its one pill.
 */
export function OtpVerificationScreen({
  email,
  devCode,
  onBack,
  onChangeEmail,
}: OtpVerificationScreenProps) {
  const { pushBanner, completeSignIn } = useAppState();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [latestDevCode, setLatestDevCode] = useState(devCode);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function verify(value: string) {
    if (verifying || value.length !== OTP_LENGTH) return;

    setVerifying(true);
    setError(null);

    try {
      const session = await verifyCode(email, value);
      completeSignIn(session);
      // No navigation call — the session is the gate, so `App.tsx` swaps the tree itself.
    } catch (err) {
      // A wrong or stale code belongs under the field, next to the digits that caused it.
      // Anything else is a condition of the world and gets the banner.
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        pushBanner("Couldn't check that code. Try again.", 'danger');
      }
      setCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;

    setError(null);
    setCode('');

    try {
      setLatestDevCode(await requestCode(email));
      setCooldown(RESEND_COOLDOWN_S);
      pushBanner('A new code is on its way.', 'success', {
        id: 'auth-resend',
        transient: true,
      });
      inputRef.current?.focus();
    } catch (err) {
      const message =
        err instanceof AuthError ? err.message : "Couldn't send a new code. Try again.";
      pushBanner(message, err instanceof AuthError ? err.tone : 'danger');
    }
  }

  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => i);

  return (
    <AuthScaffold
      onBack={onBack}
      eyebrow="Verify"
      title="Enter the six digits"
      subtitle={
        <>
          Sent to <Text style={styles.address}>{email}</Text>
        </>
      }
      footer={
        <>
          <Button
            title={verifying ? 'Checking…' : 'Verify'}
            onPress={() => verify(code)}
            disabled={verifying || code.length !== OTP_LENGTH}
          />
          <Button
            title={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            onPress={resend}
            variant="quiet"
            disabled={cooldown > 0 || verifying}
          />
          <Button title="Use a different address" onPress={onChangeEmail} variant="quiet" />
        </>
      }
    >
      <View style={styles.row}>
        {boxes.map((index) => {
          const digit = code[index];
          // The next empty box is the one being typed into. Once full, the last box keeps
          // the mark, so the row never goes flat right before it submits.
          const active = index === Math.min(code.length, OTP_LENGTH - 1);

          return (
            <View key={index} style={[styles.box, active && styles.boxActive]}>
              <Text style={styles.digit}>{digit ?? ''}</Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          style={styles.hidden}
          value={code}
          onChangeText={(value) => {
            // Autofill and pastes arrive whole, and can carry spaces or a stray letter.
            const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
            setCode(digits);
            if (error) setError(null);
            if (digits.length === OTP_LENGTH) verify(digits);
          }}
          // Pinned to the end so a tap can't drop the caret mid-string, where a keystroke
          // would rewrite the middle of the code and the boxes would lie about it.
          selection={{ start: code.length, end: code.length }}
          editable={!verifying}
          autoFocus
          caretHidden
          maxLength={OTP_LENGTH}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          accessibilityLabel="Six-digit code"
        />
      </View>

      <FieldError message={error} />

      {__DEV__ && latestDevCode ? (
        <Text style={styles.stub}>Stub build — the code is {latestDevCode}</Text>
      ) : null}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  address: {
    color: Colors.fg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  box: {
    flex: 1,
    height: OTP_BOX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
  },
  boxActive: {
    borderColor: Colors.fg,
  },
  digit: {
    ...Typography.h2,
    color: Colors.fg,
  },
  /**
   * Stretched over the whole row rather than parked off-screen, so a tap on any box lands
   * on the field and raises the keyboard.
   */
  hidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  stub: {
    ...Typography.small,
    fontSize: 13,
    color: Colors.caption,
    marginTop: Spacing.m,
  },
});
