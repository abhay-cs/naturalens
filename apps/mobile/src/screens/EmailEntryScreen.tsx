import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { BorderRadii, Colors, Spacing, Typography } from '../theme/tokens';
import { AuthScaffold } from '../components/AuthScaffold';
import { Button } from '../components/Button';
import { FieldError } from '../components/FieldError';
import { useAppState } from '../contexts/AppStateContext';
import { AuthError, requestCode, validateEmail } from '../lib/auth';

interface EmailEntryScreenProps {
  email: string;
  onEmailChange: (value: string) => void;
  onBack: () => void;
  /** Carries the stub's code through to Screen 21 — see `lib/auth.ts`. */
  onCodeSent: (devCode: string) => void;
}

/**
 * Screen 20 — the address.
 *
 * The first text input in the app, so the field style starts here. It is taken from the
 * waitlist form on the landing site rather than invented: uppercase 11px label, a 2px
 * bordered box, the border darkening to ink on focus, a pill submit, and caption-grey fine
 * print underneath. That surface already solved this in the same design system, and two
 * sign-up forms that look different is a worse outcome than a little duplication.
 *
 * Errors go under the field in ink (`FieldError`), not into a banner — see that file.
 */
export function EmailEntryScreen({
  email,
  onEmailChange,
  onBack,
  onCodeSent,
}: EmailEntryScreenProps) {
  const { pushBanner } = useAppState();
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (sending) return;

    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(null);
    setSending(true);

    try {
      const devCode = await requestCode(email);
      onCodeSent(devCode);
    } catch (err) {
      // The message is the copy and the tone travels with it — `docs/DESIGN.md` §5a.
      // A failure to reach the server is a condition of the world, so it earns a banner;
      // a malformed address, handled above, does not.
      const tone = err instanceof AuthError ? err.tone : 'danger';
      const message =
        err instanceof AuthError ? err.message : "Couldn't send a code. Try again.";
      pushBanner(message, tone);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthScaffold
      onBack={onBack}
      eyebrow="Sign in"
      title="Where should we send your code?"
      subtitle="No password. We send six digits and you type them on the next screen."
      footer={
        <>
          <Button
            title={sending ? 'Sending…' : 'Send code'}
            onPress={submit}
            disabled={sending || email.trim().length === 0}
          />
          <Text style={styles.fine}>
            No newsletter, no forwarding. Your finds stay on this phone either way.
          </Text>
        </>
      }
    >
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={email}
        onChangeText={(value) => {
          onEmailChange(value);
          if (error) setError(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={submit}
        placeholder="you@field.org"
        placeholderTextColor={Colors.caption}
        editable={!sending}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        accessibilityLabel="Email address"
      />
      <FieldError message={error} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.label,
    color: Colors.muted,
    marginBottom: Spacing.m,
  },
  input: {
    ...Typography.body,
    color: Colors.fg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: Spacing.m,
    // Vertical padding rather than a height, so the box grows with the system text size.
    paddingVertical: Spacing.m,
  },
  /** Focus is a border that goes to ink. There is no focus ring — the system has no hue. */
  inputFocused: {
    borderColor: Colors.fg,
  },
  fine: {
    ...Typography.small,
    fontSize: 13,
    color: Colors.caption,
    textAlign: 'center',
  },
});
