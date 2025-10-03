import SignIn from './components/signin'
import { GoogleOAuthProvider } from '@react-oauth/google'

function App() {
  const GOOGLE_AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    <div className="dark">
      <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
        <SignIn />
      </GoogleOAuthProvider>
    </div >
  )
}

export default App