import SignIn from './components/signin'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast';

function App() {
  const GOOGLE_AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    <div className="dark">
      <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
        <SignIn />
        <Toaster />
      </GoogleOAuthProvider>
    </div >
  )
}

export default App