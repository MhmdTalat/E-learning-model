import { useAuth, User as UserType } from '@/context/AuthContext';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { User, Mail, Shield, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import * as authAPI from '@/api/auth';

const UserProfile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const payload: Record<string, unknown> = {
        userName: formData.name,
        email: formData.email,
      };

      await authAPI.updateProfile(payload);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar Section */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center border-2 border-border">
                  <span className="text-3xl font-bold text-accent-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">{user?.role}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Profile Information */}
      {user && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.role && (
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="text-foreground mt-1">{user.role}</p>
                </div>
              )}
              {user.bio && (
                <div>
                  <Label className="text-sm text-muted-foreground">Bio</Label>
                  <p className="text-foreground mt-1">{user.bio}</p>
                </div>
              )}
              {user.phoneNumber && (
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <p className="text-foreground mt-1">{user.phoneNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
