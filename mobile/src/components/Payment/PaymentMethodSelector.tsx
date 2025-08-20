import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Text,
  List,
  IconButton,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { StripePaymentService, PaymentMethodInfo } from '../../services/StripePaymentService';

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected: (paymentMethodId: string) => void;
  onAddNewPaymentMethod: () => void;
  selectedPaymentMethodId?: string;
  showApplePay?: boolean;
  showGooglePay?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onPaymentMethodSelected,
  onAddNewPaymentMethod,
  selectedPaymentMethodId,
  showApplePay = true,
  showGooglePay = true,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [applePaySupported, setApplePaySupported] = useState(false);
  const [googlePaySupported, setGooglePaySupported] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<string | null>(null);

  const paymentService = StripePaymentService.getInstance();

  useEffect(() => {
    loadPaymentMethods();
    checkDigitalWalletSupport();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { paymentMethods: methods, error } = await paymentService.getPaymentMethods();
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        setPaymentMethods(methods);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const checkDigitalWalletSupport = async () => {
    if (showApplePay && Platform.OS === 'ios') {
      const supported = await paymentService.isApplePayAvailable();
      setApplePaySupported(supported);
    }

    if (showGooglePay && Platform.OS === 'android') {
      const supported = await paymentService.isGooglePayAvailable();
      setGooglePaySupported(supported);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deletePaymentMethod(paymentMethodId),
        },
      ]
    );
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      setDeletingMethod(paymentMethodId);
      const { success, error } = await paymentService.removePaymentMethod(paymentMethodId);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
        
        // If this was the selected method, clear selection
        if (selectedPaymentMethodId === paymentMethodId) {
          onPaymentMethodSelected('');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove payment method');
    } finally {
      setDeletingMethod(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const { success, error } = await paymentService.setDefaultPaymentMethod(paymentMethodId);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        // Update local state to reflect new default
        setPaymentMethods(prev => 
          prev.map(pm => ({
            ...pm,
            isDefault: pm.id === paymentMethodId,
          }))
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const handleApplePayPress = () => {
    onPaymentMethodSelected('apple_pay');
  };

  const handleGooglePayPress = () => {
    onPaymentMethodSelected('google_pay');
  };

  const renderPaymentMethod = (method: PaymentMethodInfo) => {
    const isSelected = selectedPaymentMethodId === method.id;
    const isDeleting = deletingMethod === method.id;

    return (
      <Card 
        key={method.id} 
        style={[
          styles.paymentMethodCard,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => onPaymentMethodSelected(method.id)}
      >
        <Card.Content style={styles.paymentMethodContent}>
          <View style={styles.paymentMethodInfo}>
            <View style={styles.cardDetails}>
              <Text style={styles.cardBrand}>
                {method.brand?.toUpperCase() || 'CARD'}
              </Text>
              <Text style={styles.cardNumber}>
                •••• •••• •••• {method.last4}
              </Text>
              <Text style={styles.cardExpiry}>
                {method.expMonth?.toString().padStart(2, '0')}/{method.expYear?.toString().slice(-2)}
              </Text>
            </View>
            
            <View style={styles.paymentMethodActions}>
              {method.isDefault && (
                <Chip style={styles.defaultChip} textStyle={styles.defaultChipText}>
                  Default
                </Chip>
              )}
              
              {!method.isDefault && (
                <Button
                  mode="text"
                  onPress={() => handleSetDefaultPaymentMethod(method.id)}
                  style={styles.setDefaultButton}
                >
                  Set Default
                </Button>
              )}
              
              <IconButton
                icon={isDeleting ? 'loading' : 'delete'}
                onPress={() => handleDeletePaymentMethod(method.id)}
                disabled={isDeleting}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Select Payment Method</Title>

      {/* Digital Wallets */}
      {(applePaySupported || googlePaySupported) && (
        <View style={styles.digitalWalletsContainer}>
          <Text style={styles.sectionTitle}>Digital Wallets</Text>
          
          {applePaySupported && (
            <Card 
              style={[
                styles.digitalWalletCard,
                selectedPaymentMethodId === 'apple_pay' && styles.selectedPaymentMethod,
              ]}
              onPress={handleApplePayPress}
            >
              <Card.Content style={styles.digitalWalletContent}>
                <Text style={styles.digitalWalletText}>  Pay</Text>
              </Card.Content>
            </Card>
          )}

          {googlePaySupported && (
            <Card 
              style={[
                styles.digitalWalletCard,
                selectedPaymentMethodId === 'google_pay' && styles.selectedPaymentMethod,
              ]}
              onPress={handleGooglePayPress}
            >
              <Card.Content style={styles.digitalWalletContent}>
                <Text style={styles.digitalWalletText}>G Pay</Text>
              </Card.Content>
            </Card>
          )}
          
          <Divider style={styles.divider} />
        </View>
      )}

      {/* Saved Payment Methods */}
      <View style={styles.savedMethodsContainer}>
        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
        
        {paymentMethods.length === 0 ? (
          <Text style={styles.noMethodsText}>
            No payment methods saved. Add one to get started.
          </Text>
        ) : (
          paymentMethods.map(renderPaymentMethod)
        )}
      </View>

      {/* Add New Payment Method */}
      <Button
        mode="outlined"
        onPress={onAddNewPaymentMethod}
        style={styles.addMethodButton}
        contentStyle={styles.addMethodButtonContent}
        icon="plus"
      >
        Add New Payment Method
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  digitalWalletsContainer: {
    marginBottom: 16,
  },
  digitalWalletCard: {
    marginBottom: 8,
    elevation: 2,
  },
  digitalWalletContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  digitalWalletText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  savedMethodsContainer: {
    marginBottom: 16,
  },
  noMethodsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  paymentMethodCard: {
    marginBottom: 8,
    elevation: 2,
  },
  selectedPaymentMethod: {
    borderColor: '#6200EE',
    borderWidth: 2,
  },
  paymentMethodContent: {
    paddingVertical: 8,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultChip: {
    marginRight: 8,
    backgroundColor: '#E8F5E8',
  },
  defaultChipText: {
    color: '#2E7D32',
    fontSize: 12,
  },
  setDefaultButton: {
    marginRight: 4,
  },
  deleteButton: {
    margin: 0,
  },
  addMethodButton: {
    marginTop: 16,
  },
  addMethodButtonContent: {
    height: 48,
  },
});

export default PaymentMethodSelector;