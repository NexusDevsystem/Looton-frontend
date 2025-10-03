import 'react-native-gesture-handler';
import 'react-native-reanimated';   // ← no topo, antes de qualquer outro import
import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)