
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, RefreshCcw } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CloudExpressUpload from '../../transfer/UploadComponent';

const Feature = ({ text }) => (
    <View style={styles.featRow}>
        <View style={styles.check}><Check size={14} color="white" /></View>
        <Text style={styles.featText}>{text}</Text>
    </View>
);

export default function Hero() {
    return (
        <LinearGradient colors={["#E6FFFC", "#FFC39B"]} style={styles.hero}>
            <Text style={styles.title}>Professional File Delivery for Client Work</Text>
            <MaskedView
                style={{ height: 70 }}
                maskElement={
                    <Text style={styles.subtitle}>
                        Not Cloud Storage
                    </Text>
                }
            >
                <LinearGradient

                    colors={["#5AC3C0", "#D8835B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                >

                    <Text style={[styles.subtitle, { opacity: 0 }]}>
                        Not Cloud Storage
                    </Text>
                </LinearGradient>
            </MaskedView>

            <CloudExpressUpload/>
            
            <Text style={styles.desc}>Secure, EU-hosted file transfer built for agencies and regulated teams.</Text>

            <View style={styles.list}>
                <Feature text="EU-hosted by default—not a US platform with EU marketing" />
                <Feature text="Built for GDPR workflows, not retrofitted compliance" />
                <Feature text="Know exactly what was sent, to whom and when" />
                <Feature text="Deliver files under your brand, not someone else's" />
            </View>

            <TouchableOpacity style={styles.btnCompare}>
                <Text style={styles.btnCompareText}>Compare Plans</Text>
                <RefreshCcw size={16} color="#d97706" style={{ marginLeft: 10 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnFree}>
                <LinearGradient
                    colors={["#E4853E", "#F1A33B"]}  
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnFree}
                >
                    <Text style={styles.btnFreeText}>Get Started Free</Text>
                    <ArrowRight size={18} color="white" style={{ marginLeft: 10 }} />
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
                Working with a team? Shared history, branding, and custom domains available on teams.
            </Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    hero: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
        alignItems: "center"
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        textAlign: "center",
        color: "#000000"
    },
    subtitle: {
        fontSize: 36,
        color: "green",
        marginVertical: 8,
        fontWeight: "bold"
    },
    desc: {
        fontSize: 20,
        textAlign: "center",
        color: "#000000E5",
        marginBottom: 30
    },
    list: {
        width: "100%",
        marginBottom: 30
    },
    featRow: {
        flexDirection: "row",
        marginBottom: 15,
        alignItems: "flex-start"
    },
    check: {
        backgroundColor: "#d97706",
        borderRadius: 100,
        marginTop: 5,
        padding: 4,
        marginRight: 12
    },
    featText: {
        flex: 1,
        color: "#000000CC",
        fontSize: 20
    },
    btnCompare: {
        flexDirection: "row",
        width: "100%", 
        height: 55,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E4853E",
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12
    },
    btnCompareText: {
        color: "#d97706",
        fontWeight: "bold",
        fontSize: 18
    },
    btnFree: {
        flexDirection: "row",
        width: "100%", 
        height: 55,
        borderRadius: 8,
        backgroundColor: "#e6a04d",
        justifyContent: "center",
        alignItems: "center"
    },
    btnFreeText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize:18
    },
    footerNote: {
        marginTop: 25,
        textAlign: "center",
        color: "#000000CC",
        fontSize: 16
    }
});