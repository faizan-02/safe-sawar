# Safe-Sawar — Women's Hyper-Local Transit

> **محفوظ سوار** — Pakistan's first NADRA-verified, women-only carpooling platform with mesh-network Emergency SOS.

---

## Features

| Feature | Description |
|---|---|
| **CNIC Biometric Verification** | Simulated NADRA/Nishan Pakistan API verification with face scan + OTP |
| **Institution Circles** | Women join trusted groups: UET Students, PIMS Doctors, NUST, Comsats, etc. |
| **Vouch System** | 5 Trust Credits to vouch for friends; earn more by completing rides |
| **Ride Scheduling & Matching** | Route-based matching with verified women near you |
| **Real-Time Ride Tracking** | Live map with animated driver location |
| **Emergency SOS + Mesh Network** | Sends SOS via internet; falls back to Bluetooth/WiFi mesh when offline |

---

## Tech Stack

- **Expo SDK 51** with React Native 0.74
- **TypeScript** throughout
- **React Navigation** (Stack + Bottom Tabs)
- **React Native Maps** for Islamabad map views
- **Expo Local Authentication** for biometric face/fingerprint scan
- **expo-haptics** for tactile SOS feedback
- **React Context + useReducer** for state management
- **Reanimated 3** for smooth animations

---

## Design

- Dark theme: deep maroon background `#1A0010`
- Accent: hot pink `#E91E8C`
- Card background: `#2D0018`
- Verified green: `#00C853`
- SOS red: `#FF1744`

---

## Project Structure

```
safe-sawar/
├── App.tsx                          # Root with GestureHandler, SafeArea, AppProvider
├── app.json                         # Expo config with permissions
├── babel.config.js                  # Reanimated plugin
├── tsconfig.json
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Stack + Bottom Tab navigator
│   ├── screens/
│   │   ├── SplashScreen.tsx         # Animated logo splash (auto-nav 3s)
│   │   ├── OnboardingScreen.tsx     # 3-slide onboarding
│   │   ├── BiometricVerificationScreen.tsx  # CNIC → Face Scan → OTP
│   │   ├── HomeScreen.tsx           # Dashboard with quick actions + SOS
│   │   ├── CirclesScreen.tsx        # 2-col grid of institution circles
│   │   ├── ScheduleRideScreen.tsx   # Map + matching SheRahs
│   │   ├── RideInProgressScreen.tsx # Live map + driver info + SOS
│   │   └── VouchScreen.tsx          # Contact list + Trust Credits
│   ├── components/
│   │   ├── SOSButton.tsx            # Pulsing SOS with confirmation + mesh fallback
│   │   ├── CircleCard.tsx           # Institution card with join/view actions
│   │   ├── RideMatchCard.tsx        # Driver card with verified badge + book
│   │   ├── BiometricScanner.tsx     # Animated hexagon face scanner
│   │   └── MeshNetworkStatus.tsx    # Animated mesh connectivity indicator
│   ├── services/
│   │   ├── biometricService.ts      # Simulated NADRA, OTP, Local Auth
│   │   ├── rideMatchingService.ts   # Mock driver data + matching
│   │   ├── meshNetworkService.ts    # Mesh SOS simulation
│   │   └── circlesService.ts        # Circle posts, stats, join/leave
│   ├── store/
│   │   └── appStore.ts              # React Context + useReducer global state
│   └── theme/
│       └── colors.ts                # Full color palette
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### Installation

```bash
cd safe-sawar
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

### Running on a simulator

```bash
# Android
npx expo start --android

# iOS (macOS only)
npx expo start --ios
```

---

## Demo Flow

1. **Splash** → auto-navigates after 3 seconds
2. **Onboarding** → swipe through 3 intro slides, tap "Get Started"
3. **Biometric Verification**:
   - Enter CNIC: `35202-1234567-8` (or any `XXXXX-XXXXXXX-X` format)
   - Tap "Verify with NADRA" → waits 2s → verified
   - Tap "Start Face Scan" → simulates biometric
   - Enter phone → tap "Send OTP" → use code **123456**
4. **Home Dashboard** → quick actions, stats, SOS button
5. **Circles Tab** → browse and join institution circles
6. **Schedule Tab** → type locations, tap "Find Matching SheRahs", book a ride
7. **Ride In Progress** → live map, driver info, Share button, Emergency SOS
8. **Vouch Tab** → vouch for contacts using Trust Credits

---

## Emergency SOS Flow

```
User presses SOS
    │
    ├─ Internet available?
    │       ├─ YES → Send location + alert via internet → Done
    │       └─ NO  → Activate mesh network
    │                     │
    │                     ├─ Scan for nearby Safe-Sawar devices (Bluetooth/WiFi)
    │                     ├─ Found devices → relay SOS hop-by-hop
    │                     └─ Message reaches internet-connected device → alert sent
```

---

## Simulated NADRA Test CNICs

| CNIC | Name | City |
|---|---|---|
| `35202-1234567-8` | Ayesha Mahmood | Islamabad |
| `37405-9876543-2` | Fatima Zahra | Lahore |
| `61101-5554443-3` | Sara Ali Khan | Karachi |
| Any `XXXXX-XXXXXXX-X` | Verified User | Islamabad |

---

## Notes

- All NADRA verification is **simulated** — no real API calls
- Maps use **react-native-maps** with a custom dark map style matching the app theme
- Mesh network is **simulated** — in production would use Bluetooth LE / WiFi Direct
- OTP demo code is always **123456**

---

*Built with care for women's safety in Pakistan. Safe-Sawar — Travel Together. Stay Safe.*
