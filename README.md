# Terminal Simple Demo (Apps on Devices)

Minimal React Native app: serverless init, discover + connect reader, create & process a payment intent client-side.

## Setup

```
npm install
```

Add the required native lifecycle hook in `android/app/src/main/java/.../MainApplication.java` (or `.kt`):

```java
import com.stripeterminalreactnative.TerminalApplicationDelegate;

@Override
public void onCreate() {
  super.onCreate();
  TerminalApplicationDelegate.onCreate(this);
}
```

### Environment

The app fetches real Terminal connection tokens and captures PaymentIntents directly against the
Stripe API, scoped to a connected account. These are read from environment variables and inlined
into the JS bundle at build/bundle time (see `babel.config.js`):

```
export STRIPE_SECRET_KEY=sk_test_...
export CONNECTED_ACCOUNT=acct_...
```

Export both before running Metro (`npm start`) or building a release APK.

## Run

```
npm run android
```

Tap "Discover & connect reader", enter an amount, then tap "Charge" and present a card.
