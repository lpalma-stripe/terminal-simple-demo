import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, View, Alert } from 'react-native';
import {
  StripeTerminalProvider,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const CONNECTED_ACCOUNT_ID = 'acct_1UKsb7L7L3G9Exr6';

async function fetchConnectionToken(): Promise<string> {
  const response = await fetch('https://api.stripe.com/v1/terminal/connection_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Account': CONNECTED_ACCOUNT_ID,
    },
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Failed to fetch connection token');
  }
  return json.secret;
}

async function capturePaymentIntent(paymentIntentId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Account': CONNECTED_ACCOUNT_ID,
      },
    }
  );
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Failed to capture payment intent');
  }
  return json;
}

function Checkout() {
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [status, setStatus] = useState('idle');

  const { initialize, easyConnect, createPaymentIntent, processPaymentIntent } =
    useStripeTerminal();

  useEffect(() => {
    initialize()
      .then((result) => console.log('initialize result', JSON.stringify(result)))
      .catch((e) => console.log('initialize threw', e));
  }, [initialize]);

  const handleDiscover = async () => {
    console.log('easyConnect pressed');
    setStatus('connecting...');
    try {
      const { reader, error } = await easyConnect({ discoveryMethod: 'appsOnDevices' });
      console.log('easyConnect returned', JSON.stringify(error), JSON.stringify(reader));
      if (error) {
        setStatus('error: ' + error.message);
        Alert.alert('easyConnect error', error.message);
        return;
      }
      setStatus('connected');
      setConnected(!!reader);
    } catch (e: any) {
      console.log('easyConnect threw', e);
      setStatus('threw: ' + (e?.message ?? String(e)));
    }
  };

  const handleCharge = async () => {
    const { paymentIntent, error: createError } = await createPaymentIntent({
      amount: Math.round(parseFloat(amount) * 100),
      currency: 'usd',
    });
    if (createError || !paymentIntent) {
      Alert.alert('createPaymentIntent error', createError?.message ?? 'unknown error');
      return;
    }

    const { paymentIntent: processed, error: processError } = await processPaymentIntent({
      paymentIntent,
    });
    if (processError) {
      Alert.alert('processPaymentIntent error', processError.message);
      return;
    }

    if (processed?.status === 'requiresCapture') {
      try {
        const captured = await capturePaymentIntent(processed.id);
        Alert.alert('Payment captured', `Status: ${captured.status}`);
      } catch (e: any) {
        Alert.alert('capturePaymentIntent error', e?.message ?? String(e));
      }
      return;
    }

    Alert.alert('Payment successful', `Status: ${processed?.status}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      {!connected ? (
        <View>
          <Button title="Discover & connect reader" onPress={handleDiscover} />
          <Text style={{ marginTop: 12 }}>Status: {status}</Text>
        </View>
      ) : (
        <View>
          <Text>Reader connected</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            style={{ borderWidth: 1, marginVertical: 12, padding: 8 }}
          />
          <Button title="Charge" onPress={handleCharge} />
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <StripeTerminalProvider tokenProvider={fetchConnectionToken}>
      <Checkout />
    </StripeTerminalProvider>
  );
}
