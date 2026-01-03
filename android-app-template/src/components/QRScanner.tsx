import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import api from '../config/api';

interface QRScannerProps {
  onScan: (itemCode: string, itemData: any) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleQRCodeRead = async (e: any) => {
    if (!scanning || loading) return;

    const code = e.data;
    
    // Prevent duplicate scans
    if (lastScanned === code) return;
    
    setLastScanned(code);
    setScanning(false);
    setLoading(true);

    try {
      // Look up item by short_code
      const response = await api.get(`/items/lookup/${code}/`);
      const itemData = response.data;
      
      setLoading(false);
      onScan(code, itemData);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Item Not Found',
        `No item found with code: ${code}`,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setLastScanned(null);
              setScanning(true);
            },
          },
          {
            text: 'Cancel',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <QRCodeScanner
        onRead={scanning ? handleQRCodeRead : undefined}
        flashMode={RNCamera.Constants.FlashMode.auto}
        topContent={
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan QR Code</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        }
        bottomContent={
          <View style={styles.bottomContent}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Looking up item...</Text>
              </View>
            )}
            {!loading && (
              <Text style={styles.instructions}>
                Position QR code within the frame
              </Text>
            )}
          </View>
        }
        cameraStyle={styles.camera}
        showMarker={true}
        markerStyle={styles.marker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 28,
  },
  bottomContent: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  marker: {
    borderColor: '#3b82f6',
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
});

export default QRScanner;
