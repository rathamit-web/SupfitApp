import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Toast from 'react-native-root-toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Handle ImagePicker unsupported file type errors
    const errorMsg = String(error?.message || error || '');
    if (errorMsg.toLowerCase().includes('unsupported') || 
        errorMsg.includes('Only images') ||
        errorMsg.includes('application/') ||
        errorMsg.includes('document') ||
        errorMsg.includes('wordprocessing')) {
      Toast.show('⚠️ Invalid file type. Please select only JPEG or PNG images.', {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        backgroundColor: '#ff3c20',
        textColor: '#fff',
        shadow: true,
        animation: true,
        hideOnPress: true,
      });
      
      // Reset error state after showing toast
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorMsg = String(this.state.error?.message || '');
      
      // For ImagePicker errors, return null to hide error screen
      if (errorMsg.toLowerCase().includes('unsupported') || 
          errorMsg.includes('Only images') ||
          errorMsg.includes('application/') ||
          errorMsg.includes('document') ||
          errorMsg.includes('wordprocessing')) {
        return null;
      }
      
      // For other errors, show error screen
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error.message}</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.resetButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff3c20',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#ff3c20',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ErrorBoundary;
