import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import api, { authService } from './src/config/api';

const App: React.FC = () => {
  React.useEffect(() => {
    // Test API connection
    api.get('/auth/csrf/')
      .then(response => {
        console.log('API Connection successful:', response.data);
      })
      .catch(error => {
        console.error('API Connection failed:', error.message);
      });
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>IMH IMS</Text>
          <Text style={styles.subtitle}>Inventory Management System</Text>
          <Text style={styles.status}>Connecting to backend...</Text>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    color: '#999',
  },
});

export default App;

