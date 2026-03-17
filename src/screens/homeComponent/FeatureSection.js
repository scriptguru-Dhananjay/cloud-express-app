import { Image, StyleSheet, Text, View } from 'react-native';

const FEATURES = [
    {
        icon: require("../../../assets/images/features/secure-shield.png"),
        title: 'Secure File Transfers',
        desc: "Send large files and sensitive documents with confidence. Just add the recipient's email address and CloudExpress handles the delivery securely.",
    },
    {
        icon: require("../../../assets/images/features/plane.png"),
        title: 'Free up to 5GB',
        desc: 'Send files up to 5GB completely free. Need larger transfers or more features? Upgrade to a subscription plan.',
    },
    {
        icon: require("../../../assets/images/features/briefcase.png"),
        title: 'Business-Ready Transfers',
        desc: 'Share critical business files securely and keep confidential documents protected. Your files are accessible only to the recipients you choose.',
    },
    {
        icon: require("../../../assets/images/features/Fast.png"),
        title: 'Fast & Effortless',
        desc: 'CloudExpress is built for speed and simplicity—upload, share, and deliver large files without delays or complicated steps.',
    },
    {
        icon: require("../../../assets/images/features/videos.png"),
        title: 'Send Long Videos with Ease',
        desc: 'Transfer long videos without worrying about file size limits. Keep your footage smooth, clear, and exactly as intended.',
    },
    {
        icon: require("../../../assets/images/features/quality.png"),
        title: 'Lossless Quality',
        desc: 'No compression, no quality drops. What you upload is what your recipients receive—perfect for high-resolution media and important documents.',
    },
];

// Feature Card 
function FeatureCard({ icon, title, desc }) {
    return (
        <View style={styles.card}>
            <View style={styles.iconWrap}>
                <Image source={icon} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>
        </View>
    );
}

//  Main Component 
export default function FeaturesSection() {
    return (
        <View style={styles.section}>
            <Text style={styles.title}>Powerful Features</Text>

            <View style={styles.cardsList}>
                {FEATURES.map((f, i) => (
                    <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
                ))}
            </View>
            
        </View>
    );
}

//  Styles 
const styles = StyleSheet.create({
    section: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 32,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: 'black',
        letterSpacing: -1.2,
        lineHeight: 48,
        marginBottom: 28,
        textAlign :"center",
    },
    cardsList: {
        gap: 24,
        marginTop:20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ebebeb',
        paddingVertical: 30,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    iconWrap: {
        marginBottom: 20,
    },
    icon: {
        width: 52,
        height: 52,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: 'black',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    cardDesc: {
        fontSize: 18,
        color: 'black',
        textAlign: 'center',
        lineHeight: 21,
    },
   
});