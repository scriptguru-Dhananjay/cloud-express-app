import { StyleSheet, Text, View } from 'react-native';

const PARAGRAPHS = [
    `Built and hosted in the EU, CloudExpress keeps your file transfers within the region. This supports data residency, client trust, and compliance for Irish and EU organisations. Whether you are sending contracts, design files, or final deliverables, recipients get a clean download experience without storage clutter or account friction.`,
    `Compliance should support your work, not slow it down. CloudExpress includes GDPR minded controls in the sending flow so your team can share with confidence. This GDPR focused file transfer service helps you manage access through email based delivery and secure links while keeping the process simple for both sender and recipient. Share only with the right people and stay aligned with internal policies without adding extra steps.`,
    `For agencies and regulated teams, delivery also needs to be reliable. CloudExpress is a business grade file transfer service built for real projects, from single documents to large folders and media files. Reliable transfers reduce back and forth, prevent failed attachments, and keep your team focused on delivery instead of troubleshooting.`,
];

export default function GDPRSection() {
    return (
        <View style={styles.section}>
            
            <View style={styles.divider} />

        
            <Text style={styles.title}>
                EU-Hosted Transfers Designed for GDPR Workflows
            </Text>

           
            <View style={styles.body}>
                {PARAGRAPHS.map((p, i) => (
                    <Text key={i} style={styles.para}>{p}</Text>
                ))}
            </View>

            
            <View style={styles.divider} />
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: 'white',
        paddingHorizontal: 28,
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'black',
        marginVertical: 24,
        opacity: 0.5,
    },
    title: {
        fontSize: 36,
        fontWeight: '600',
        color: 'black',
        textAlign: 'center',
        letterSpacing: -0.4,
        marginTop:20,
        marginBottom: 24,
    },
    body: {
        gap: 18,
    },
    para: {
        fontSize: 18,
        color: 'black',
        lineHeight: 24,
        fontWeight: '400',
    },
});