import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import 'react-native-get-random-values';
import Svg, { Path } from "react-native-svg";
import { v4 as uuidv4 } from 'uuid';


const CHUNK_SIZE = 1024 * 1024;
const BASE_URL = "https://cloud-express-app-backend.onrender.com";
const UPLOAD_URL = `${BASE_URL}/api/FileUploader/Save`;
const FREE_LIMIT_BYTES = 2.5 * 1024 * 1024 * 1024;
const { width } = Dimensions.get('window');

const OVERALL_NOTIF_ID = 'overall_upload_progress';
const OVERALL_CATEGORY_UPLOADING = 'overall_uploading';
const OVERALL_CATEGORY_PAUSED    = 'overall_paused';
const OVERALL_CATEGORY_DONE      = 'overall_done';


// Controls how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// Requests notification permission
async function registerForNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Notification permission denied');
    }
}

// Register overall notification categories with Pause/Resume/Cancel actions
async function registerOverallCategories() {
    await Notifications.setNotificationCategoryAsync(OVERALL_CATEGORY_UPLOADING, [
        {
            identifier: 'overall_pause',
            buttonTitle: 'Pause All',
            options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: false },
        },
        {
            identifier: 'overall_cancel',
            buttonTitle: 'Cancel All',
            options: { isDestructive: true, isAuthenticationRequired: false, opensAppToForeground: false },
        },
    ]);

    await Notifications.setNotificationCategoryAsync(OVERALL_CATEGORY_PAUSED, [
        {
            identifier: 'overall_resume',
            buttonTitle: 'Resume All',
            options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: false },
        },
        {
            identifier: 'overall_cancel',
            buttonTitle: 'Cancel All',
            options: { isDestructive: true, isAuthenticationRequired: false, opensAppToForeground: false },
        },
    ]);

    await Notifications.setNotificationCategoryAsync(OVERALL_CATEGORY_DONE, [
        {
            identifier: 'overall_clear',
            buttonTitle: 'Clear',
            options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: false },
        },
    ]);
}


if (__DEV__) {
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
    global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
        console.log("GLOBAL ERROR:", error.message, error.stack);
        originalHandler?.(error, isFatal);
    });
}


// Background File Type Icons
const BG_ICONS = [
    { label: 'MP4', color: "#E4853E", top: 30, left: 20, rotate: '-15deg', size: 64 },
    { label: 'ZIP', color: '#c0d8f0', top: 20, right: 30, rotate: '12deg', size: 72 },
    { label: 'JPG', color: '#c0e8c0', top: 160, left: 10, rotate: '-8deg', size: 60 },
    { label: 'PDF', color: '#f0c0c0', top: 140, right: 10, rotate: '18deg', size: 66 },
    { label: 'PS', color: '#d0c0f0', top: 290, left: 30, rotate: '-20deg', size: 62 },
    { label: 'PPT', color: '#f8d8b0', top: 280, right: 20, rotate: '10deg', size: 60 },
];

function FileTypeIcon({ label, color, style }) {
    return (
        <View style={[bgIconStyles.card, { borderColor: color }, style]}>
            <View style={[bgIconStyles.dot, { backgroundColor: color }]} />
            <Text style={[bgIconStyles.label, { color }]}>{label}</Text>
        </View>
    );
}

const bgIconStyles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: 54, height: 64,
        borderRadius: 10,
        borderWidth: 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.45,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    dot: { width: 18, height: 18, borderRadius: 4, marginBottom: 4 },
    label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});


// Format Bytes Helper
function formatBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}


// Main Component
export default function CloudExpressUpload() {

    const [files, setFiles] = useState([]);
    const [overallStatus, setOverallStatus] = useState('idle');
    const [screen, setScreen] = useState('upload');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const fileControlsRef = useRef({});
    const currentUidRef = useRef(null);

    // Single overall-progress notification — no per-file notif IDs needed
    const overallNotifScheduledRef = useRef(false);

    const filesRef = useRef([]);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const usedPercent = Math.min((totalSize / FREE_LIMIT_BYTES) * 100, 100);

    // Refs so notification listener can always call the latest handler
    const handlePauseAllRef   = useRef(null);
    const handleResumeAllRef  = useRef(null);
    const handleCancelAllRef  = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    
    useEffect(() => {
    const setup = async () => {
        await registerForNotifications();
        await registerOverallCategories();
        await Notifications.setNotificationChannelAsync('upload-progress', {
            name: 'Upload Progress',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: null,
            enableVibrate: false,
            sound: null,
        });
        await Notifications.setNotificationChannelAsync('expo_notifications_fallback_notification_channel', {
            name: 'Miscellaneous',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: null,
            enableVibrate: false,
            sound: null,
        });
    };
    setup();

    //track AppState changes
    const appStateSub = AppState.addEventListener('change', nextState => {
        appStateRef.current = nextState;
    });

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const action = response.actionIdentifier;
        if (action === 'overall_pause')  handlePauseAllRef.current?.();
        if (action === 'overall_resume') handleResumeAllRef.current?.();
        if (action === 'overall_cancel') handleCancelAllRef.current?.();
        if (action === 'overall_clear') {
            Notifications.dismissNotificationAsync(OVERALL_NOTIF_ID);
            overallNotifScheduledRef.current = false;
        }
    });

    return () => {
        sub.remove();
        appStateSub.remove(); 
    };
}, []);


    // Overall notification helpers 

  const showOverallNotification = async ({ title, body, categoryIdentifier, sticky = true }) => {
    console.log(' NOTIFICATION FIRED:', title, '| AppState:', appStateRef.current);

    if (appStateRef.current === 'active') {
        console.log(' SKIPPED — app is active');
        return;
    }

    await Notifications.scheduleNotificationAsync({
        identifier: OVERALL_NOTIF_ID,
        content: {
            title,
            body,
            sticky,
            autoDismiss: !sticky,
            categoryIdentifier,
            data: {},
            //top-level in content, no nesting
            channelId: 'upload-progress',
        },
        trigger: null,
    });
    overallNotifScheduledRef.current = true;
};

    const refreshOverallNotification = async (isPausedState = false, snapshot = null) => {
        const allFiles = snapshot ?? filesRef.current;
        if (!allFiles.length) return;

        const totalFiles   = allFiles.length;
        const doneCount    = allFiles.filter(f => f.status === 'done').length;
        const cancelCount  = allFiles.filter(f => f.status === 'cancelled').length;
        const errorCount   = allFiles.filter(f => f.status === 'error').length;

        const activeFiles = allFiles.filter(f => !['cancelled', 'error'].includes(f.status));
        const overallPct = activeFiles.length > 0
            ? Math.round(activeFiles.reduce((sum, f) => sum + (f.progress || 0), 0) / activeFiles.length)
            : 100;

        const allDone = doneCount + cancelCount + errorCount === totalFiles;

        if (allDone) {
            await showOverallNotification({
                title: `Upload complete — ${doneCount} of ${totalFiles} file${totalFiles !== 1 ? 's' : ''}`,
                body: cancelCount > 0 ? `${cancelCount} cancelled` : 'All files uploaded successfully',
                categoryIdentifier: OVERALL_CATEGORY_DONE,
                sticky: false,
            });
            return;
        }

        const pausedCount  = allFiles.filter(f => f.status === 'paused').length;
        const activeCount  = totalFiles - doneCount - cancelCount - errorCount - pausedCount;

        // Build a rich body that shows every non-zero status inline
        const buildBody = () => {
            const parts = [];
            if (doneCount > 0)   parts.push(`${doneCount} done`);
            if (pausedCount > 0) parts.push(`${pausedCount} paused`);
            if (cancelCount > 0) parts.push(`${cancelCount} cancelled`);
            if (activeCount > 0) parts.push(`${activeCount} uploading`);
            return parts.length > 0 ? parts.join(' · ') : `${doneCount} of ${totalFiles} file${totalFiles !== 1 ? 's' : ''} done`;
        };

        if (isPausedState) {
            await showOverallNotification({
                title: `Upload paused · ${overallPct}%`,
                body: buildBody(),
                categoryIdentifier: OVERALL_CATEGORY_PAUSED,
            });
        } else {
            await showOverallNotification({
                title: `Uploading · ${overallPct}%`,
                body: buildBody(),
                categoryIdentifier: OVERALL_CATEGORY_UPLOADING,
            });
        }
    };


    //Pick Files

    const handlePickFiles = async () => {
        console.log("Opening picker...");
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: true,
            });

            console.log("Picker result:", result);

            if (result.canceled) {
                console.log("Picker cancelled");
                return;
            }

            setFiles(prev => {
                const startIdx = prev.length;
                const newFiles = result.assets.map((asset, idx) => ({
                    id: uuidv4(),         
                    uri: asset.uri,
                    name: asset.name,
                    size: asset.size,
                    mimeType: asset.mimeType || 'application/octet-stream',
                    status: 'pending',
                    progress: 0,
                }));

                newFiles.forEach(file => {
                    fileControlsRef.current[file.id] = { 
                        isPaused: false,
                        isCancelled: false,
                        resume: null,
                    };
                });

                const next = [...prev, ...newFiles];
                filesRef.current = next;
                return next;
            });

            setOverallStatus('idle');

        } catch (err) {
            console.log("Picker Error:", err);
            Alert.alert('Picker Error', err.message);
        }
    };


    // Start All Uploads

    const handleStartAll = async () => {
        console.log("Starting upload...");

        if (files.length === 0) {
            Alert.alert('No files', 'Please select files first.');
            return;
        }

        setOverallStatus('uploading');

        let uid;
        try {
            uid = uuidv4();
        } catch (e) {
            uid = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        currentUidRef.current = uid;

        // Show initial overall notification
        await showOverallNotification({
            title: `Uploading · 0%`,
            body: `0 of ${files.length} file${files.length !== 1 ? 's' : ''} done`,
            categoryIdentifier: OVERALL_CATEGORY_UPLOADING,
        });

        await Promise.all(files.map((file) => uploadFile(file, uid)));

        console.log("All uploads complete");
        setOverallStatus('done');
        await refreshOverallNotification(false);
    };


    // Upload single file 

    const uploadFile = async (file, uid) => {
        const fileId = file.id;
        console.log(`Uploading file [${fileId}]`, file.name);

        fileControlsRef.current[fileId] = { isPaused: false, isCancelled: false, resume: null };
        updateFile(fileId, { status: 'uploading', progress: 0 });

        const success = await uploadInChunks(file.uri, file.name, file.size, uid, file.mimeType, fileId);

        console.log(`Upload result for ${file.name}:`, success);

        if (success) {
            updateFile(fileId, { status: 'done', progress: 100 });
        } else if (fileControlsRef.current[fileId]?.isCancelled) {
            const next = filesRef.current.map(f =>
                f.id === fileId ? { ...f, status: 'cancelled', progress: 0 } : f
            );
            filesRef.current = next;
            setFiles(next);
            refreshOverallNotification(next.some(f => f.status === 'paused'), next);
        } else {
            updateFile(fileId, { status: 'error' });
        }
    };


    //  Pause / Resume / Cancel ALL

    const handlePauseAll = () => {
        console.log('Pause all');
        Object.keys(fileControlsRef.current).forEach(fileId => {
            const ctrl = fileControlsRef.current[fileId];
            const file = filesRef.current.find(f => f.id === fileId);
            if (ctrl && file?.status === 'uploading') {
                ctrl.isPaused = true;
            }
        });
        const next = filesRef.current.map(f =>
            f.status === 'uploading' ? { ...f, status: 'paused' } : f
        );
        filesRef.current = next;
        setFiles(next);
        setOverallStatus('paused');
        refreshOverallNotification(true, next);
    };
    handlePauseAllRef.current = handlePauseAll;

    const handleResumeAll = () => {
        console.log('Resume all');
        Object.keys(fileControlsRef.current).forEach(fileId => {
            const ctrl = fileControlsRef.current[fileId];
            const file = filesRef.current.find(f => f.id === fileId);
            if (ctrl && file?.status === 'paused') {
                ctrl.isPaused = false;
                if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
            }
        });
        const next = filesRef.current.map(f =>
            f.status === 'paused' ? { ...f, status: 'uploading' } : f
        );
        filesRef.current = next;
        setFiles(next);
        setOverallStatus('uploading');
        refreshOverallNotification(false, next);
    };
    handleResumeAllRef.current = handleResumeAll;

    const handleCancelAll = () => {
        console.log('Cancel all');
        Object.keys(fileControlsRef.current).forEach(fileId => {
            const ctrl = fileControlsRef.current[fileId];
            const file = filesRef.current.find(f => f.id === fileId);
            if (ctrl) {
                ctrl.isCancelled = true;
                ctrl.isPaused = false;
                if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
            }
            const activeStatuses = ['uploading', 'paused'];
            if (file && activeStatuses.includes(file.status)) {
                fetch(`${BASE_URL}/api/FileUploader/Cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUidRef.current, fileName: file.name }),
                }).catch(() => { });
            }
        });
        const next = filesRef.current.map(f =>
            ['uploading', 'paused'].includes(f.status)
                ? { ...f, status: 'cancelled', progress: 0 }
                : f
        );
        filesRef.current = next;
        setFiles(next);
        setOverallStatus('idle');
        refreshOverallNotification(false, next);
    };
    handleCancelAllRef.current = handleCancelAll;


    // Per-file pause / resume / cancel

    const handlePauseFile = (fileId) => {
        if (fileControlsRef.current[fileId]) {
            fileControlsRef.current[fileId].isPaused = true;
        }
        const next = filesRef.current.map(f =>
            f.id === fileId ? { ...f, status: 'paused' } : f
        );
        filesRef.current = next;
        setFiles(next);
        refreshOverallNotification(true, next);
    };

    const handleResumeFile = (fileId) => {
        const ctrl = fileControlsRef.current[fileId];
        if (ctrl) {
            ctrl.isPaused = false;
            if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
        }
        const next = filesRef.current.map(f =>
            f.id === fileId ? { ...f, status: 'uploading' } : f
        );
        filesRef.current = next;
        setFiles(next);
        const anyPaused = next.some(f => f.status === 'paused');
        refreshOverallNotification(anyPaused, next);
    };

    const handleCancelFile = (fileId) => {
        const ctrl = fileControlsRef.current[fileId];
        const file = filesRef.current.find(f => f.id === fileId);

        if (ctrl) {
            ctrl.isCancelled = true;
            ctrl.isPaused = false;
            if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
        }

        const activeStatuses = ['uploading', 'paused'];
        if (file && activeStatuses.includes(file.status)) {
            fetch(`${BASE_URL}/api/FileUploader/Cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUidRef.current, fileName: file.name }),
            }).catch(() => { });
        }

        const next = filesRef.current.map(f =>
            f.id === fileId ? { ...f, status: 'cancelled', progress: 0 } : f
        );
        filesRef.current = next;
        setFiles(next);

        const anyPaused = next.some(f => f.status === 'paused');
        refreshOverallNotification(anyPaused, next);
    };

    const handleRemoveFile = (fileId) => {
        const next = filesRef.current.filter(f => f.id !== fileId);
        filesRef.current = next;
        setFiles(next);
        delete fileControlsRef.current[fileId];
    };

    const checkPauseOrCancel = (fileId) => {
        return new Promise((resolve) => {
            const ctrl = fileControlsRef.current[fileId];
            if (!ctrl) { resolve(false); return; }

            if (ctrl.isCancelled) {
                resolve(true);
                return;
            }

            if (ctrl.isPaused) {
                ctrl.resume = () => resolve(ctrl.isCancelled);
            } else resolve(false);
        });
    };


    // Chunk Upload

    const uploadInChunks = async (fileUri, fileName, fileSize, uid, mimeType, fileIndex) => {
        console.log(`Chunk upload started: ${fileName}`);

        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

        for (let index = 0; index < totalChunks; index++) {

            const cancelled = await checkPauseOrCancel(fileIndex);
            if (cancelled) return false;

            try {
                const offset = index * CHUNK_SIZE;
                const length = Math.min(CHUNK_SIZE, fileSize - offset);

                const tempUri = `${FileSystem.cacheDirectory}chunk_${fileIndex}_${index}_${uid}.tmp`;

                const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                    encoding: 'base64',
                    position: offset,
                    length,
                }).catch(async () => {
                    const full = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
                    return full.substring(
                        Math.floor(offset / 3) * 4,
                        Math.floor(offset / 3) * 4 + Math.ceil(length / 3) * 4
                    );
                });

                await FileSystem.writeAsStringAsync(tempUri, base64Data, { encoding: 'base64' });

                await RNBlobUtil.fetch(
                    'POST',
                    UPLOAD_URL,
                    { 'Content-Type': 'multipart/form-data' },
                    [
                        { name: 'chunk-index', data: index.toString() },
                        { name: 'total-chunk', data: totalChunks.toString() },
                        { name: 'chunk-size', data: length.toString() },
                        { name: 'fileName', data: fileName },
                        { name: 'bucketSize', data: fileSize.toString() },
                        { name: 'totalFiles', data: '1' },
                        { name: 'uid', data: uid },
                        { name: 'from', data: senderEmail || 'user@example.com' },
                        { name: 'to', data: recipientEmail || 'recipient@example.com' },
                        {
                            name: 'uploadFiles',
                            filename: fileName,
                            type: mimeType,
                            data: RNBlobUtil.wrap(tempUri),
                        },
                    ]
                );

                await FileSystem.deleteAsync(tempUri, { idempotent: true });

                if (fileControlsRef.current[fileIndex]?.isCancelled) return false;

                const progress = Math.round(((index + 1) / totalChunks) * 100);

                if (progress < 100) {
                    updateFile(fileIndex, { progress });
                } else {
                    if (!fileControlsRef.current[fileIndex]?.isCancelled) {
                        const next = filesRef.current.map(f => f.id === fileIndex ? { ...f, progress: 100 } : f);
                        filesRef.current = next;
                        setFiles(next);
                        refreshOverallNotification(next.some(f => f.status === 'paused'), next);
                    }
                }

            } catch (e) {
                console.log("Chunk upload error:", e);
                Alert.alert('Upload Error', `${fileName} chunk ${index}: ${e.message}`);
                return false;
            }
        }

        return true;
    };


    //  Update File State + refresh overall notification

    const updateFile = (fileId, changes) => {
        const current = filesRef.current.find(f => f.id === fileId);
        if (current && ['cancelled', 'error'].includes(current.status)) {
            console.log(`Update file [${fileId}] skipped — already ${current.status}`);
            return;
        }
        console.log(`Update file [${fileId}]`, changes);
        const next = filesRef.current.map(f => f.id === fileId ? { ...f, ...changes } : f);
        filesRef.current = next;
        setFiles(next);
        const anyPaused = next.some(f => f.status === 'paused');
        refreshOverallNotification(anyPaused, next);
    };


    // Helpers 

    const getFileExt = (name) => (name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);

    const statusColor = (s) => {
        if (s === 'done') return '#4CAF50';
        if (s === 'paused') return '#F59E0B';
        if (s === 'cancelled' || s === 'error') return '#EF4444';
        return '#F97316';
    };

    const handleNextPress = () => {
        if (files.length === 0) {
            handlePickFiles();
        } else {
            setScreen('email');
        }
    };

    const handleSendPress = () => {
        if (!recipientEmail.trim()) {
            Alert.alert('Missing Email', 'Please enter recipient\'s email.');
            return;
        }
        if (!senderEmail.trim()) {
            Alert.alert('Missing Email', 'Please enter your email.');
            return;
        }
        setScreen('upload');
        handleStartAll();
    };


    // Email Screen

    if (screen === 'email') {
        return (
            <View style={{ width: '100%', paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={emailStyles.card}>
                    {BG_ICONS.map((ic, i) => (
                        <FileTypeIcon
                            key={i}
                            label={ic.label}
                            color={ic.color}
                            style={{
                                top: ic.top,
                                ...(ic.left !== undefined ? { left: ic.left } : { right: ic.right }),
                                transform: [{ rotate: ic.rotate }],
                                width: ic.size, height: ic.size + 10,
                            }}
                        />
                    ))}

                    <View style={emailStyles.inputContainer}>
                        <TextInput
                            style={emailStyles.input}
                            placeholder="Recipient's Email"
                            placeholderTextColor="#bbb"
                            value={recipientEmail}
                            onChangeText={setRecipientEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={emailStyles.divider} />
                        <TextInput
                            style={emailStyles.input}
                            placeholder="Your email"
                            placeholderTextColor="#bbb"
                            value={senderEmail}
                            onChangeText={setSenderEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                <TouchableOpacity style={emailStyles.sendBtn} onPress={handleSendPress} activeOpacity={0.88}>
                    <Text style={emailStyles.sendBtnTxt}>Send</Text>
                </TouchableOpacity>

                <TouchableOpacity style={emailStyles.backBtn} onPress={() => setScreen('upload')}>
                    <Text style={emailStyles.backBtnTxt}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }


    // Upload Screen 

    return (
        <View style={{ width: '100%', paddingHorizontal: 20, paddingBottom: 20 }}>

            <View style={s.card}>

                {BG_ICONS.map((ic, i) => (
                    <FileTypeIcon
                        key={i}
                        label={ic.label}
                        color={ic.color}
                        style={{
                            top: ic.top,
                            ...(ic.left !== undefined ? { left: ic.left } : { right: ic.right }),
                            transform: [{ rotate: ic.rotate }],
                            width: ic.size, height: ic.size + 10,
                        }}
                    />
                ))}

                {files.length === 0 ? (
                    <TouchableOpacity
                        style={s.dropZoneEmpty}
                        onPress={overallStatus === 'idle' ? handlePickFiles : undefined}
                        activeOpacity={0.85}
                    >
                        <View style={s.uploadIcon}>
                            <Svg
                                width={48}
                                height={48}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#888"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <Path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                                <Path d="M12 10v6" />
                                <Path d="m9 13 3-3 3 3" />
                            </Svg>
                        </View>
                        <Text style={s.dropText}>UPLOAD FILE</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={s.dropZoneFiles}>
                        <ScrollView
                            style={{ width: '100%' }}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {files.map((file) => (
                                <View key={file.id} style={s.fileRow}>

                                    <View style={[s.extBadge, { borderColor: statusColor(file.status) }]}>
                                        <Text style={[s.extText, { color: statusColor(file.status) }]}>
                                            {getFileExt(file.name)}
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                                        <Text style={s.fileSizeText}>
                                            {formatBytes(file.size)}
                                            {['uploading', 'paused'].includes(file.status) ? `  \u2022 ${file.progress}%` : ''}
                                            {file.status === 'done' ? '  \u2022  Done' : ''}
                                            {file.status === 'cancelled' ? '  \u2022 Cancelled' : ''}
                                            {file.status === 'error' ? '  \u2022  Error' : ''}
                                        </Text>

                                        {['uploading', 'paused', 'done'].includes(file.status) && (
                                            <View style={s.miniTrack}>
                                                <View style={[s.miniFill, {
                                                    width: `${file.progress}%`,
                                                    backgroundColor: statusColor(file.status),
                                                }]} />
                                            </View>
                                        )}

                                        {['uploading', 'paused'].includes(file.status) && (
                                            <View style={s.fileBtns}>
                                                {file.status === 'uploading' && (
                                                    <TouchableOpacity style={s.miniBtn} onPress={() => handlePauseFile(file.id)}>
                                                        <Text style={s.miniBtnTxt}>Pause</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {file.status === 'paused' && (
                                                    <TouchableOpacity style={[s.miniBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleResumeFile(file.id)}>
                                                        <Text style={s.miniBtnTxt}>Resume</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity style={[s.miniBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleCancelFile(file.id)}>
                                                    <Text style={s.miniBtnTxt}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    {['pending', 'cancelled', 'done', 'error'].includes(file.status) && overallStatus === 'idle' && (
                                        <TouchableOpacity onPress={() => handleRemoveFile(file.id)} style={s.removeBtn}>
                                            <Text style={{ color: '#aaa', fontSize: 16 }}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {overallStatus === 'idle' && (
                                <TouchableOpacity style={s.addMoreBtn} onPress={handlePickFiles}>
                                    <Text style={s.addMoreTxt}>+ Add more files</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                )}

                <View style={s.bottomBar}>
                    <View style={s.bottomBarRow}>
                        <Text style={s.bottomBarLeft}>
                            {files.length} FILE{files.length !== 1 ? 'S' : ''}
                        </Text>
                        <Text style={s.bottomBarRight}>
                            {formatBytes(FREE_LIMIT_BYTES - totalSize)} FREE
                        </Text>
                    </View>
                    <View style={s.storageTrack}>
                        <View style={[s.storageFill, { width: `${usedPercent}%` }]} />
                    </View>
                </View>
            </View>

            {overallStatus === 'idle' && files.length > 0 && (
                <TouchableOpacity style={s.nextBtn} onPress={handleNextPress} activeOpacity={0.88}>
                    <Text style={s.nextBtnTxt}>Next</Text>
                </TouchableOpacity>
            )}

            {overallStatus === 'idle' && files.length === 0 && (
                <TouchableOpacity style={s.nextBtn} onPress={handlePickFiles} activeOpacity={0.88}>
                    <Text style={s.nextBtnTxt}>Next</Text>
                </TouchableOpacity>
            )}

            {overallStatus === 'uploading' && (
                <View style={[s.nextBtn, { backgroundColor: '#ccc' }]}>
                    <Text style={s.nextBtnTxt}>Uploading...</Text>
                </View>
            )}

            {overallStatus === 'done' && (
                <TouchableOpacity
                    style={s.nextBtn}
                    onPress={() => {
                        setFiles([]);
                        filesRef.current = [];
                        setOverallStatus('idle');
                        setRecipientEmail('');
                        setSenderEmail('');
                    }}
                    activeOpacity={0.88}
                >
                    <Text style={s.nextBtnTxt}>Upload More Files</Text>
                </TouchableOpacity>
            )}

        </View>
    );
}


// Email Styles
const emailStyles = StyleSheet.create({
    inputContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    input: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 16,
    },
    sendBtn: {
        marginTop: 20,
        width: '100%',
        backgroundColor: "#E4853E",
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#F97316',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    sendBtnTxt: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    backBtn: {
        marginTop: 14,
        alignItems: 'center',
    },
    backBtnTxt: {
        color: '#E4853E',
        fontSize: 15,
        fontWeight: '600',
    },
});


// Upload Styles
const s = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: '#f5f4f0',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        minHeight: 420,
    },
    dropZoneEmpty: {
        minHeight: 340,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    dropZoneFiles: {
        minHeight: 340,
        maxHeight: 340,
        padding: 12,
    },
    uploadIcon: {
        marginBottom: 12,
        opacity: 0.5,
    },
    dropText: {
        fontSize: 18,
        color: '#aaa',
        fontWeight: '500',
        letterSpacing: 0.2,
    },

    bottomBar: {
        backgroundColor: "#E4853E",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    bottomBarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    bottomBarLeft: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },
    bottomBarRight: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },
    storageTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    storageFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    nextBtn: {
        marginTop: 20,
        width: '100%',
        backgroundColor: "#E4853E",
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#F97316',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    nextBtnTxt: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    extBadge: {
        width: 44, height: 52,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },
    extText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
        marginBottom: 2,
    },
    fileSizeText: {
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
    },
    miniTrack: {
        height: 4,
        backgroundColor: '#eee',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    miniFill: {
        height: '100%',
        borderRadius: 2,
    },
    fileBtns: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 4,
    },
    miniBtn: {
        backgroundColor: '#F97316',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    miniBtnTxt: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    removeBtn: {
        padding: 4,
        marginLeft: 6,
    },
    addMoreBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 4,
    },
    addMoreTxt: {
        color: '#F97316',
        fontWeight: '700',
        fontSize: 14,
    },
});