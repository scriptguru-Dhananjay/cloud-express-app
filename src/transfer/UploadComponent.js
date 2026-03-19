import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
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
const BASE_URL = "https://pinnular-darin-unleasable.ngrok-free.dev";
const UPLOAD_URL = `${BASE_URL}/api/FileUploader/Save`;
const FREE_LIMIT_BYTES = 2.5 * 1024 * 1024 * 1024;
const { width } = Dimensions.get('window');



// Controls how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false, 
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// Requests notification 
async function registerForNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Notification permission denied');
    }
}

async function setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('upload_uploading', [
        {
            identifier: 'pause_all',
            buttonTitle: 'Pause',
            options: { isDestructive: false, isAuthenticationRequired: false ,opensAppToForeground: false},
        },
        {
            identifier: 'cancel_all',
            buttonTitle: 'Cancel',
            options: { isDestructive: true, isAuthenticationRequired: false , opensAppToForeground: false},
        },
    ]);

    await Notifications.setNotificationCategoryAsync('upload_paused', [
        {
            identifier: 'resume_all',
            buttonTitle: 'Resume',
            options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: false },
        },
        {
            identifier: 'cancel_all',
            buttonTitle: 'Cancel',
            options: { isDestructive: true, isAuthenticationRequired: false },
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


//  Format Bytes Helper 
function formatBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}


//  Main Component 
export default function CloudExpressUpload() {

    const [files, setFiles] = useState([]);
    const [overallStatus, setOverallStatus] = useState('idle');
    const [screen, setScreen] = useState('upload');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const fileControlsRef = useRef({});
    const currentUidRef = useRef(null);
    const notifIdRef = useRef(null);       

    const notifCategoryRef = useRef('upload_uploading'); // tracks current category

const handlePauseAll = () => {
    files.forEach((_, idx) => {
        if (fileControlsRef.current[idx] && !fileControlsRef.current[idx].isPaused) {
            fileControlsRef.current[idx].isPaused = true;
            updateFile(idx, { status: 'paused' });
        }
    });
    notifCategoryRef.current = 'upload_paused';
    // update notification category immediately
    if (notifIdRef.current) {
        Notifications.scheduleNotificationAsync({
            identifier: notifIdRef.current,
            content: {
                title: 'Upload Paused',
                body: 'Tap Resume to continue.',
                sticky: true,
                autoDismiss: false,
                categoryIdentifier: 'upload_paused',
            },
            trigger: null,
        });
    }
};

const handleResumeAll = () => {
    files.forEach((file, idx) => {
        const ctrl = fileControlsRef.current[idx];
        if (ctrl && ctrl.isPaused) {
            ctrl.isPaused = false;
            updateFile(idx, { status: 'uploading' });
            if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
        }
    });
    notifCategoryRef.current = 'upload_uploading';
    if (notifIdRef.current) {
        Notifications.scheduleNotificationAsync({
            identifier: notifIdRef.current,
            content: {
                title: 'Uploading files...',
                body: 'Resumed.',
                sticky: true,
                autoDismiss: false,
                categoryIdentifier: 'upload_uploading',
            },
            trigger: null,
        });
    }
};

const handleCancelAll = () => {
    files.forEach((file, idx) => {
        handleCancelFile(idx);
    });
    if (notifIdRef.current) {
        Notifications.dismissNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
    }
    setOverallStatus('idle');
};

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const usedPercent = Math.min((totalSize / FREE_LIMIT_BYTES) * 100, 100);


   // AFTER — registers once, reads handlers via stable refs
const handlePauseAllRef  = useRef(null);
const handleResumeAllRef = useRef(null);
const handleCancelAllRef = useRef(null);

// Keep refs pointing to latest versions of handlers
handlePauseAllRef.current  = handlePauseAll;
handleResumeAllRef.current = handleResumeAll;
handleCancelAllRef.current = handleCancelAll;

useEffect(() => {
    registerForNotifications();
    setupNotificationCategories();

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const action = response.actionIdentifier;
        if (action === 'pause_all')  handlePauseAllRef.current?.();
        if (action === 'resume_all') handleResumeAllRef.current?.();
        if (action === 'cancel_all') handleCancelAllRef.current?.();
    });

    return () => sub.remove();
}, []); // ← empty array: registers ONCE only

    // Pick Files 
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
                    id: startIdx + idx,
                    uri: asset.uri,
                    name: asset.name,
                    size: asset.size,
                    mimeType: asset.mimeType || 'application/octet-stream',
                    status: 'pending',
                    progress: 0,
                }));

                newFiles.forEach((_, idx) => {
                    fileControlsRef.current[startIdx + idx] = {
                        isPaused: false,
                        isCancelled: false,
                        resume: null,
                    };
                });

                return [...prev, ...newFiles];
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
            console.log("No files selected");
            Alert.alert('No files', 'Please select files first.');
            return;
        }

        setOverallStatus('uploading');

        //  Show uploading notification in status bar
        notifIdRef.current = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Uploading files...',
                body: `0% — 0/${files.length} file(s) done`,
                sticky: true,        
                autoDismiss: false,
                categoryIdentifier: 'upload_uploading',
            },
            trigger: null,          
        });
        notifCategoryRef.current = 'upload_uploading';

        let uid;
        try {
            uid = uuidv4();
            console.log("UID:", uid);
        } catch (e) {
            uid = Date.now().toString(36) + Math.random().toString(36).substr(2);
            console.log("Fallback UID:", uid);
        }
        currentUidRef.current = uid;

        await Promise.all(files.map((file, idx) => uploadFile(file, idx, uid)));

        console.log("All uploads complete");
        setOverallStatus('done');

        // Update notification to Upload Complete
        if (notifIdRef.current) {
            await Notifications.scheduleNotificationAsync({
                identifier: notifIdRef.current,
                content: {
                    title: 'Upload Complete!',
                    body: `All ${files.length} file(s) uploaded successfully.`,
                    autoDismiss: true,
                    categoryIdentifier: notifCategoryRef.current,
                },
                trigger: null,
            });
            // Auto-dismiss the notification
            setTimeout(() => {
                Notifications.dismissNotificationAsync(notifIdRef.current);
                notifIdRef.current = null;
            }, 4000);
        }
    };


    // Upload 
    const uploadFile = async (file, idx, uid) => {
        console.log(`Uploading file [${idx}]`, file);

        fileControlsRef.current[idx] = { isPaused: false, isCancelled: false, resume: null };

        updateFile(idx, { status: 'uploading', progress: 0 });

        const success = await uploadInChunks(file.uri, file.name, file.size, uid, file.mimeType, idx);

        console.log(`Upload result for ${file.name}:`, success);

        if (success) updateFile(idx, { status: 'done', progress: 100 });
        else if (fileControlsRef.current[idx]?.isCancelled)
            updateFile(idx, { status: 'cancelled', progress: 0 });
        else updateFile(idx, { status: 'error' });
    };


    //  Pause 
    const handlePauseFile = (idx) => {
        console.log(`Pause file [${idx}]`);
        if (fileControlsRef.current[idx]) {
            fileControlsRef.current[idx].isPaused = true;
            updateFile(idx, { status: 'paused' });
        }
    };
 //  Resume 
    const handleResumeFile = (idx) => {
        console.log(`Resume file [${idx}]`);
        const ctrl = fileControlsRef.current[idx];
        if (ctrl) {
            ctrl.isPaused = false;
            updateFile(idx, { status: 'uploading' });
            if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
        }
    };
 //   Cancel 
    const handleCancelFile = (idx) => {
        const ctrl = fileControlsRef.current[idx];
        const file = files[idx];

        if (ctrl) {
            ctrl.isCancelled = true;
            ctrl.isPaused = false;
            if (ctrl.resume) { ctrl.resume(); ctrl.resume = null; }
        }

        if (file && file.status === 'uploading' || file?.status === 'paused') {
            fetch(`${BASE_URL}/api/FileUploader/Cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUidRef.current, fileName: file.name }),
            }).catch(() => {});
        }
    };

    const handleRemoveFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
        delete fileControlsRef.current[idx];
    };

    const checkPauseOrCancel = (idx) => {
        return new Promise((resolve) => {
            const ctrl = fileControlsRef.current[idx];
            if (!ctrl) { resolve(false); return; }

            if (ctrl.isCancelled) {
                console.log(`File [${idx}] cancelled`);
                resolve(true);
                return;
            }

            if (ctrl.isPaused) {
                console.log(`File [${idx}] paused`);
                ctrl.resume = () => resolve(ctrl.isCancelled);
            } else resolve(false);
        });
    };


    //  Chunk Upload 
    const uploadInChunks = async (fileUri, fileName, fileSize, uid, mimeType, fileIndex) => {
        console.log(`Chunk upload started: ${fileName}`);

        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
        console.log(`Total chunks: ${totalChunks}`);

        for (let index = 0; index < totalChunks; index++) {

            const cancelled = await checkPauseOrCancel(fileIndex);
            if (cancelled) return false;

            try {
                const offset = index * CHUNK_SIZE;
                const length = Math.min(CHUNK_SIZE, fileSize - offset);

                console.log(`Chunk ${index + 1}/${totalChunks}`);

                const tempUri = `${FileSystem.cacheDirectory}chunk_${fileIndex}_${index}_${uid}.tmp`;

                const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                    encoding: 'base64',
                    position: offset,
                    length,
                }).catch(async () => {
                    console.log("Fallback full read used");
                    const full = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
                    return full.substring(
                        Math.floor(offset / 3) * 4,
                        Math.floor(offset / 3) * 4 + Math.ceil(length / 3) * 4
                    );
                });

                await FileSystem.writeAsStringAsync(tempUri, base64Data, { encoding: 'base64' });

                console.log(`Uploading chunk ${index + 1}`);

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
                )
                .uploadProgress((written, total) => {
                    const chunkProgress = Math.round((written / total) * 100);
                    console.log(`Chunk ${index + 1} progress: ${chunkProgress}%`);
                });

                await FileSystem.deleteAsync(tempUri, { idempotent: true });

                const progress = Math.round(((index + 1) / totalChunks) * 100);
                console.log(`Overall Progress ${fileName}: ${progress}%`);

                updateFile(fileIndex, { progress });

            } catch (e) {
                console.log("Chunk upload error:", e);
                Alert.alert('Upload Error', `${fileName} chunk ${index}: ${e.message}`);
                return false;
            }
        }

        console.log(`Finished uploading ${fileName}`);
        return true;
    };


    // Update File State + Notification
    const updateFile = (idx, changes) => {
        console.log(`Update file [${idx}]`, changes);

        setFiles(prev => {
            const updated = prev.map((f, i) => i === idx ? { ...f, ...changes } : f);

            //  Update status bar notification with overall progress
            if (notifIdRef.current && changes.progress !== undefined) {
                const totalProgress = Math.round(
                    updated.reduce((sum, f) => sum + (f.progress || 0), 0) / updated.length
                );
                const doneCount = updated.filter(f => f.status === 'done').length;

                Notifications.scheduleNotificationAsync({
                    identifier: notifIdRef.current,
                    content: {
                        title: ' Uploading files...',
                        body: `${totalProgress}% — ${doneCount}/${updated.length} file(s) done`,
                        sticky: true,
                        autoDismiss: false,
                        categoryIdentifier: notifCategoryRef.current,
                    },
                    trigger: null,
                });
            }

            return updated;
        });
    };


    //  Helpers 
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


    //  Email Screen 
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
                            {files.map((file, idx) => (
                                <View key={idx} style={s.fileRow}>

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
                                            {file.status === 'cancelled' ? '  \u2022 Cancel' : ''}
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
                                                    <TouchableOpacity style={s.miniBtn} onPress={() => handlePauseFile(idx)}>
                                                        <Text style={s.miniBtnTxt}>Pause</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {file.status === 'paused' && (
                                                    <TouchableOpacity style={[s.miniBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleResumeFile(idx)}>
                                                        <Text style={s.miniBtnTxt}>Resume</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity style={[s.miniBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleCancelFile(idx)}>
                                                    <Text style={s.miniBtnTxt}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    {['pending', 'cancelled', 'done', 'error'].includes(file.status) && overallStatus === 'idle' && (
                                        <TouchableOpacity onPress={() => handleRemoveFile(idx)} style={s.removeBtn}>
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


//Email Styles
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


// ─── Upload Styles ─────────────────────────────────────────────────────────────
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