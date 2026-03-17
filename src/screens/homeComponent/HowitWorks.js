import { ArrowRight, Check } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STEPS = [
    {
        bold: 'Upload your files',
        desc: ' - Add documents, folders, or videos to start your transfer.',
    },
    {
        bold: 'Send by email or secure link',
        desc: ' - Enter recipient emails for direct delivery, or copy a secure link to share your way.',
    },
    {
        bold: 'Control access and track downloads',
        desc: ' -  Set link expiry and access options, then get visibility and alerts when files are delivered and downloaded.',
    },
];

function StepItem({ bold, desc }) {
    return (
        <View style={styles.stepRow}>
            <View style={styles.checkWrap}>
                <Check size={14} color="#22a06b" strokeWidth={3} />
            </View>
            <Text style={styles.stepText}>
                <Text style={styles.stepBold}>{bold}</Text>
                <Text style={styles.stepDesc}>{desc}</Text>
            </Text>
        </View>
    );
}



export default function HowItWorks() {
    return (
        <View style={styles.section}>

            <Text style={styles.title}>How it works</Text>


            <Text style={styles.subtitle}>
                CloudExpress helps you send large files through secure, EU hosted transfers that fit GDPR minded workflows.
            </Text>


            <View style={styles.stepsList}>
                {STEPS.map((step, i) => (
                    <StepItem key={i} bold={step.bold} desc={step.desc} />
                ))}
            </View>


            <TouchableOpacity style={styles.btn} activeOpacity={0.85}>
                <Text style={styles.btnTxt}>Transfer Now</Text>
                <ArrowRight size={18} color="white" strokeWidth={2.5} style={{ marginLeft: 8 }} />
            </TouchableOpacity>


            <Image
                source={require("../../../assets/images/home/home-page-uploader.png")}
                style={styles.UploaderImage}
                resizeMode="contain"
            />

            <View style={styles.divider} />
        </View>
    );
}

// Styles 
const styles = StyleSheet.create({
    section: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 22,
        paddingTop: 30,
        paddingBottom: 18,
    },
    title: {
        fontSize: 44,
        fontWeight: '600',
        color: 'black',
        letterSpacing: -1,
        marginBottom: 16,
        lineHeight: 44,
    },
    subtitle: {
        fontSize: 20,
        color: 'black',
        lineHeight: 23,
        marginBottom: 28,
    },
    stepsList: {
        gap: 22,
        marginBottom: 32,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    checkWrap: {
        marginTop: 5,
        flexShrink: 0,
    },
    stepText: {
        flex: 1,
        fontSize: 18,
        lineHeight: 23,
        color: 'black',
    },
    stepBold: {
        fontWeight: '600',
        color: 'black',
    },
    stepDesc: {
        fontWeight: '400',
        color: "black",
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 28,
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 2,
    },
    btnTxt: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.2,
    },
    UploaderImage: {
        height: 400,
        width: 400,
    },
    divider: {
        height: 1,
        backgroundColor: 'black',
        opacity: 0.5,
    },
});

