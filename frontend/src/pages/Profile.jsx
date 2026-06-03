import { useEffect, useState } from 'react';
import {
  getUserProfileApi,
  saveUserProfileApi,
  getUserAddressesApi,
  addUserAddressApi,
  deleteUserAddressApi,
  getUserSettingsApi,
  saveUserSettingsApi,
} from '../api';

const initialProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ label: '', address: '', city: '', country: '' });
  const [settings, setSettings] = useState({ newsletter: true, notifications: true });

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getUserProfileApi();
        const profileData = user.profile || initialProfile;
        setProfile(profileData);
        localStorage.setItem('userProfile', JSON.stringify(profileData));
      } catch {
        const stored = localStorage.getItem('userProfile');
        if (stored) setProfile(JSON.parse(stored));
      }

      try {
        const savedAddresses = await getUserAddressesApi();
        setAddresses(savedAddresses);
      } catch {
        const addrs = localStorage.getItem('userAddresses');
        if (addrs) setAddresses(JSON.parse(addrs));
      }

      try {
        const savedSettings = await getUserSettingsApi();
        setSettings(savedSettings);
      } catch {
        const s = localStorage.getItem('userSettings');
        if (s) setSettings(JSON.parse(s));
      }
    }

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await saveUserProfileApi(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setSaved(true);
    } catch {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setSaved(true);
    }
    window.setTimeout(() => setSaved(false), 2500);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    const newAddr = { id: Date.now().toString(), ...addressForm };
    try {
      const added = await addUserAddressApi(newAddr);
      setAddresses((prev) => [...prev, added]);
    } catch {
      const next = [...addresses, newAddr];
      setAddresses(next);
      localStorage.setItem('userAddresses', JSON.stringify(next));
    }
    setAddressForm({ label: '', address: '', city: '', country: '' });
  };

  const removeAddress = async (id) => {
    try {
      await deleteUserAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      const next = addresses.filter((a) => a.id !== id);
      setAddresses(next);
      localStorage.setItem('userAddresses', JSON.stringify(next));
    }
  };

  const saveSettings = async () => {
    try {
      await saveUserSettingsApi(settings);
      setSaved(true);
    } catch {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setSaved(true);
    }
    window.setTimeout(() => setSaved(false), 2000);
  };

  const forgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset link sent to your email (demo only)');
  };

  const applySavedAddress = (address) => {
    setProfile((prev) => ({
      ...prev,
      address: address.address,
      city: address.city,
      country: address.country,
    }));
  };

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country'];
    return requiredFields.every((field) => profile[field]?.trim());
  };

  return (
    <div className="p-3 sm:p-4 max-w-3xl mx-auto pb-6">
      {/* Profile Status Banner */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        isProfileComplete(profile)
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
      }`}>
        <div className="flex items-start gap-3">
          <span className={`text-2xl flex-shrink-0 ${isProfileComplete(profile) ? '✅' : '⚠️'}`}></span>
          <div className="flex-1">
            <p className={`font-semibold ${
              isProfileComplete(profile)
                ? 'text-green-800 dark:text-green-200'
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {isProfileComplete(profile)
                ? 'Your Profile is Complete!'
                : 'Your Profile is Incomplete'}
            </p>
            <p className={`text-sm mt-1 ${
              isProfileComplete(profile)
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {isProfileComplete(profile)
                ? 'Your shipping address is saved. You can now place orders without entering details again.'
                : 'Please fill in your name, email, and shipping address to place orders.'}
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Profile</h1>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          {isProfileComplete(profile) && <span className="text-green-600">✓</span>}
          Personal Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">First name <span className="text-red-500">*</span></span>
              <input name="firstName" value={profile.firstName} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" placeholder="John" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Last name <span className="text-red-500">*</span></span>
              <input name="lastName" value={profile.lastName} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" placeholder="Doe" required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Email <span className="text-red-500">*</span></span>
              <input type="email" name="email" value={profile.email} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" placeholder="john@example.com" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone</span>
              <input type="tel" name="phone" value={profile.phone} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" placeholder="(123) 456-7890" />
            </label>
          </div>

          {/* Shipping Address Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Shipping Address <span className="text-red-500">*</span></h3>
            <label className="block mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Street Address</span>
              <input 
                value={profile.address || ''} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" 
                placeholder="123 Main Street" 
                required 
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">City</span>
                <input 
                  value={profile.city || ''} 
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })} 
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" 
                  placeholder="New York" 
                  required 
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Country</span>
                <input 
                  value={profile.country || ''} 
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })} 
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary" 
                  placeholder="United States" 
                  required 
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4">
            <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark">
              {isProfileComplete(profile) ? '✓ Save Changes' : 'Complete Profile'}
            </button>
            {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Saved successfully!</span>}
          </div>
        </form>
      </div>

      {/* Saved Addresses Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Saved Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">No saved addresses yet.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {addresses.map((a) => (
              <li key={a.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{a.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{a.address}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{a.city}, {a.country}</div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  <button type="button" onClick={() => navigator.clipboard.writeText(`${a.address}, ${a.city}, ${a.country}`)} className="flex-1 sm:w-auto px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">Copy</button>
                  <button type="button" onClick={() => applySavedAddress(a)} className="flex-1 sm:w-auto px-3 py-1 rounded-md border border-blue-300 dark:border-blue-600 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">Use this address</button>
                  <button type="button" onClick={() => removeAddress(a.id)} className="flex-1 sm:w-auto px-3 py-1 rounded-md border border-red-300 dark:border-red-600 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={saveAddress} className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add New Address</h3>
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300">Label</span>
            <input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900" placeholder="Home, Office" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300">Address</span>
            <input value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900" placeholder="123 Main St" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
            <input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="Country" className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          </div>
          <button type="submit" className="w-full bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-dark transition">Save Address</button>
        </form>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Notifications & Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscribe to newsletter</span>
            <input type="checkbox" checked={settings.newsletter} onChange={(e) => setSettings((s) => ({ ...s, newsletter: e.target.checked }))} className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order notifications</span>
            <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings((s) => ({ ...s, notifications: e.target.checked }))} className="w-4 h-4" />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={saveSettings} className="w-full sm:w-auto bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-dark transition">Save Settings</button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">✓ Settings saved</span>}
        </div>
      </div>

      {/* Forgot Password Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Security</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Forgot your password? We can help you recover your account.</p>
        <form onSubmit={forgotPassword}>
          <button type="submit" className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition">Forgot Password?</button>
        </form>
      </div>
    </div>
  );
}
