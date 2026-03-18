import { router } from 'expo-router';
import { Component } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

const EyeIcon = ({ visible }) => (
  <View style={styles.eyeIcon}>
    {visible ?  <EyeClosedIcon /> : <EyeOpenIcon />}
  </View>
)

const EyeOpenIcon = ({ size = 22, color = "#00000099" }) => (
  <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
        stroke={color}
        strokeWidth={2}
      />

      <Path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );

const EyeClosedIcon = ({ size = 22, color = "#00000099" }) => (
  <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
);


const CheckBox = ({ checked, onPress, label }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <CheckIcon />}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
)

const CheckIcon = ({ size = 14, color = "white" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const GoogleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
    <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
    <Path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.8-5.3l-6.4-5.2C29.3 35.7 26.8 36.6 24 36.6c-5.4 0-9.9-3.3-11.5-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.2-5.6 6.7l6.4 5.2C39.5 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
  </Svg>
);

const MicrosoftIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <Rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <Rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <Rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </Svg>
);

export default class RegisterScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      ageConfirmed: false,
      termsAgreed: false,
    }
  }

  handleRegister = () => {
    const { fullName, email, password, confirmPassword, ageConfirmed, termsAgreed } = this.state
    // registration logic here
  }

  render() {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      ageConfirmed,
      termsAgreed,
    } = this.state

    return (
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Header */}
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start sharing files securely in minutes</Text>

            {/*  Name */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#00000099"
                value={fullName}
                onChangeText={(text) => this.setState({ fullName: text })}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#00000099"
                value={email}
                onChangeText={(text) => this.setState({ email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, styles.inputRow]}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Password"
                placeholderTextColor="#00000099"
                value={password}
                onChangeText={(text) => this.setState({ password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => this.setState({ showPassword: !showPassword })}
              >
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputWrapper, styles.inputRow]}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Confirm Password"
                placeholderTextColor="#00000099"
                value={confirmPassword}
                onChangeText={(text) => this.setState({ confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => this.setState({ showConfirmPassword: !showConfirmPassword })}
              >
                <EyeIcon visible={showConfirmPassword} />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordText}>
              Min 8 characters with uppercase, lowercase, number &amp; special character.
            </Text>

            {/* Checkboxes */}
            <CheckBox
              checked={ageConfirmed}
              onPress={() => this.setState({ ageConfirmed: !ageConfirmed })}
              label="I confirm I am 16+ and legally permitted to use this platform."
            />

            {/* Terms  */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => this.setState({ termsAgreed: !termsAgreed })}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
                {termsAgreed && <CheckIcon/>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.link} onPress={() => router.push('/term-service')}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={this.handleRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>Create Account</Text>
            </TouchableOpacity>

            {/* Log in link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <GoogleIcon />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            {/* Microsoft Button */}
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <MicrosoftIcon />
              <Text style={styles.socialBtnText}>Office 365</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      </SafeAreaView>
    )
  }
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a1a1a"
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: "black",
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "black",
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },

  
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: "white",
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    color: "black",
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  passwordText: {
    fontSize: 12,
    color: "grayx",
    lineHeight: 24,
    marginBottom: 20,
    marginTop: -4,
  },

 
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "black",
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#E8943A",
    borderColor: "#E8943A",
  },
  checkmark: {
    color: "white",
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13.5,
    color: "black",
    lineHeight: 20,
  },
  link: {
    color: "#E8943A",
    
  },

  createBtn: {
    backgroundColor: "#E8943A",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#E8943A",
    elevation: 2,
  },
  createBtnText: {
    color: "white",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 16,
    color: "black",
  },
  loginLink: {
    fontSize: 16,
    color: "#E8943A",
  },

  
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "gray",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: "black"
  },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: "#D0D1D240",
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '400',
    color: "black",
    marginLeft: 10,
  },

  msLogo: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  msSquare: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
})