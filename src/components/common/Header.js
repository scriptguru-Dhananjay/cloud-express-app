import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;


function CloudExpressLogo() {
  return (
    <Image
      source={require('../../../assets/images/logo/logo-dark.png')}
      style={{
        height: 40,
        width: 120,
        resizeMode: 'contain',
      }}
    />
  );
}



function HamburgerIcon({ color = '#fff' }) {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24">
            <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
}

// Close Icon
function CloseIcon({ color = '#333' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
            <Line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="20" y1="4" x2="4" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
}

//  Nav item
const NAV_ITEMS = [
    { label: 'Home', route: '/' },
    { label: 'Transfer Files', route: '/' },
    { label: 'Pricing', route: '/' },
    { label: 'About Us', route: '/' },
    { label: 'Blog', route: '/' },
    { label: 'Contact Us', route: '/' },
];

// Drawer 
function Drawer({ visible, onClose }) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animate open/close
    const prevVisible = useRef(false);
    if (visible !== prevVisible.current) {
        prevVisible.current = visible;
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }

    const handleNav = (route) => {
        onClose();
        setTimeout(() => router.push(route), 250);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Dim backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[drawerStyles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            {/* Drawer panel */}
            <Animated.View
                style={[
                    drawerStyles.panel,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Drawer header */}
                    <View style={drawerStyles.drawerHeader}>
                        <CloudExpressLogo  />
                        <TouchableOpacity onPress={onClose} style={drawerStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <CloseIcon color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Nav links */}
                    <View style={drawerStyles.navList}>
                        {NAV_ITEMS.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={drawerStyles.navItem}
                                onPress={() => handleNav(item.route)}
                                activeOpacity={0.6}
                            >
                                <Text style={drawerStyles.navLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Divider */}
                    <View style={drawerStyles.divider} />

                    {/* Auth buttons */}
                    <View style={drawerStyles.authButtons}>
                        <TouchableOpacity
                            style={drawerStyles.loginBtn}
                            onPress={() => handleNav('/login')}
                            activeOpacity={0.7}
                        >
                            <Text style={drawerStyles.loginTxt}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={drawerStyles.signupBtn}
                            onPress={() => handleNav('/register')}
                            activeOpacity={0.8}
                        >
                            <Text style={drawerStyles.signupTxt}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
}

const drawerStyles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    panel: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomWidth: 0,
    },
    closeBtn: {
        padding: 4,
    },
    navList: {
        paddingHorizontal: 22,
        paddingTop: 10,
    },
    navItem: {
        paddingVertical: 17,
        borderBottomWidth: 0,
    },
    navLabel: {
        fontSize: 20,
        color: '#1a1a1a',
        fontWeight: '400',
        letterSpacing: 0.1,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 22,
        marginVertical: 16,
    },
    authButtons: {
        paddingHorizontal: 22,
        gap: 12,
    },
    loginBtn: {
        width: '100%',
        height: 36,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginTxt: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    signupBtn: {
        width: '100%',
        height: 36,
        borderRadius: 8,
        backgroundColor: '#E4853E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E4853E',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    signupTxt: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});

//  Main Header Component 

export default function Header() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <View style={styles.header}>
                <View style={styles.inner}>
                    <CloudExpressLogo />
                    <TouchableOpacity
                        onPress={() => setDrawerOpen(true)}
                        style={styles.menuBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <HamburgerIcon color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#1a1a1a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 20,   
    },
    menuBtn: {
        padding: 4,
    },
});