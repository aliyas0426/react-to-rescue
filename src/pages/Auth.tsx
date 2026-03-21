import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await signUp(email, password, fullName);
        toast.success('Account created! Signing you in...');
        navigate('/', { replace: true });
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred';
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials or sign up for a new account.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please verify your email address before signing in.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">DisasterHub</CardTitle>
          <CardDescription>{isSignUp ? 'Create your account' : 'Sign in to continue'}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required minLength={6} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-primary hover:underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
