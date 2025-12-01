import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  Lock,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";

/**
 * Modernized Settings UI (visual-only)
 * - left vertical tab navigation
 * - right content card with clean spacing, soft shadows, subtle gradients
 * - retains all original backend calls & logic unchanged
 *
 * NOTE: If your app uses a different tailwind config, tweak class names to match.
 */

export default function Settings() {
  const { user, logout, updateUser, refreshUser } = useAuth();

  // loading states separated per section
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");

  // inline messages
  const [profileMessage, setProfileMessage] = useState(null);
  const [emailMessage, setEmailMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [accountMessage, setAccountMessage] = useState(null);

  // Profile
  const [profileData, setProfileData] = useState({ name: "" });
  const originalProfileName = useMemo(() => user?.name || "", [user]);

  // Email
  const [emailData, setEmailData] = useState({ email: "", current_password: "" });
  const [verificationToken, setVerificationToken] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Password
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Account deletion
  const [deletionData, setDeletionData] = useState({ password: "", confirmation: false });
  const [deletionStatus, setDeletionStatus] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const getCSRFToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

  useEffect(() => {
    if (user) setProfileData({ name: user.name || "" });
    fetchDeletionStatus();
    setProfileMessage(null);
    setEmailMessage(null);
    setPasswordMessage(null);
    setAccountMessage(null);
  }, [user]);

  const fetchDeletionStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.get(`${API_URL}/user/deletion-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setDeletionStatus(res.data.data);
    } catch (err) {
      console.error("Failed to fetch deletion status:", err);
    }
  };

  // ---- profile handlers (unchanged endpoints) ----
  const profileChanged = useMemo(() => (profileData.name || "") !== (originalProfileName || ""), [profileData.name, originalProfileName]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!profileChanged) {
      setProfileMessage({ type: "info", text: "No changes to save." });
      return;
    }
    setLoadingProfile(true);
    setProfileMessage(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.put(
        `${API_URL}/user/profile/name`,
        { name: profileData.name },
        { headers: { Authorization: `Bearer ${token}`, "X-CSRF-TOKEN": getCSRFToken() } }
      );
      if (res.data.success) {
        if (res.data.data.user) updateUser(res.data.data.user);
        setProfileMessage({ type: "success", text: "Name updated." });
        Swal.fire({ icon: "success", title: "Saved", text: "Name updated successfully", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update name";
      setProfileMessage({ type: "error", text: msg });
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingProfile(false);
    }
  };

  // ---- email handlers ----
  const validEmailFormat = (email) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailHasChange = useMemo(() => emailData.email && emailData.email !== (user?.email || ""), [emailData.email, user]);

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailMessage(null);
    if (!validEmailFormat(emailData.email)) {
      setEmailMessage({ type: "error", text: "Invalid email format." });
      return;
    }
    setLoadingEmail(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(`${API_URL}/user/email/request-change`, emailData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setShowEmailVerification(true);
        setEmailMessage({ type: "success", text: "Verification code sent to new email." });
        Swal.fire({ icon: "info", title: "Check Email", text: "Verification code sent", confirmButtonColor: "#E46036" });
        setEmailData(prev => ({ ...prev, current_password: "" }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to request email change";
      setEmailMessage({ type: "error", text: msg });
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setEmailMessage(null);
    setLoadingEmail(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(`${API_URL}/user/email/verify`, { token: verificationToken }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        if (res.data.data.user) updateUser(res.data.data.user);
        setEmailMessage({ type: "success", text: "Email updated." });
        Swal.fire({ icon: "success", title: "Success!", text: "Email updated", timer: 1500, showConfirmButton: false });
        setShowEmailVerification(false);
        setVerificationToken("");
        setEmailData({ email: "", current_password: "" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid verification code";
      setEmailMessage({ type: "error", text: msg });
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingEmail(false);
    }
  };

  // ---- password handlers ----
  const passwordStrength = useMemo(() => {
    const pw = passwordData.password || "";
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }, [passwordData.password]);

  const passwordValidClient = useMemo(() => passwordStrength >= 4, [passwordStrength]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      Swal.fire({ icon: "error", title: "Error", text: "Passwords do not match" });
      return;
    }
    if (!passwordValidClient) {
      setPasswordMessage({ type: "error", text: "Password too weak." });
      return;
    }
    setLoadingPassword(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.put(`${API_URL}/user/password`, passwordData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setPasswordMessage({ type: "success", text: "Password updated." });
        Swal.fire({ icon: "success", title: "Success!", text: "Password updated", timer: 1500, showConfirmButton: false });
        setPasswordData({ current_password: "", password: "", password_confirmation: "" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password";
      setPasswordMessage({ type: "error", text: msg });
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingPassword(false);
    }
  };

  // ---- sessions & account deletion (endpoints unchanged) ----
  const handleLogoutAllDevices = async () => {
    const result = await Swal.fire({
      title: "Logout from all other devices?",
      text: "You will remain logged in on this device, but all other devices will be logged out",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E46036",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, logout other devices",
    });
    if (!result.isConfirmed) return;
    setLoadingAccount(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(`${API_URL}/user/logout-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: "success", title: "Success!", text: res.data.message, timer: 1500, showConfirmButton: false });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to logout from all devices";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    if (!deletionData.confirmation) {
      setAccountMessage({ type: "error", text: "Please confirm deletion checkbox." });
      return;
    }
    const result = await Swal.fire({
      title: "Delete Account?",
      html: `<p>This will schedule your account for deletion in 30 days.</p><p class="text-sm text-gray-600 mt-2">You can cancel this within the 30-day period.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete my account",
    });
    if (!result.isConfirmed) return;
    setLoadingAccount(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(`${API_URL}/user/account/delete`, deletionData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setAccountMessage({ type: "success", text: "Account scheduled for deletion (30 days)." });
        fetchDeletionStatus();
        setDeletionData({ password: "", confirmation: false });
        Swal.fire({ icon: "success", title: "Deletion Requested", text: `Account will be deleted in 30 days`, confirmButtonColor: "#E46036" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to request deletion";
      setAccountMessage({ type: "error", text: msg });
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleCancelDeletion = async () => {
    const result = await Swal.fire({
      title: "Cancel Account Deletion?",
      text: "Your account will remain active",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#E46036",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, cancel deletion",
    });
    if (!result.isConfirmed) return;
    setLoadingAccount(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.post(`${API_URL}/user/account/cancel-delete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setAccountMessage({ type: "success", text: "Deletion cancelled." });
        fetchDeletionStatus();
        Swal.fire({ icon: "success", title: "Deletion Cancelled", text: "Your account is no longer scheduled for deletion", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      setAccountMessage({ type: "error", text: "Failed to cancel deletion" });
      Swal.fire({ icon: "error", title: "Error", text: "Failed to cancel deletion" });
    } finally {
      setLoadingAccount(false);
    }
  };

  // small UI helpers
  const InlineMessage = ({ msg }) => {
    if (!msg) return null;
    const base = "px-3 py-2 rounded text-sm mb-3";
    if (msg.type === "success") return <div className={`bg-green-50 text-green-800 border border-green-100 ${base}`}>{msg.text}</div>;
    if (msg.type === "error") return <div className={`bg-red-50 text-red-800 border border-red-100 ${base}`}>{msg.text}</div>;
    return <div className={`bg-gray-50 text-gray-800 border border-gray-100 ${base}`}>{msg.text}</div>;
  };

  // compact preview for collapsed question (not used here, but kept consistent with prior patterns)
  const Tab = ({ id, label, Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg transition-all text-sm ${
        activeTab === id ? "bg-gradient-to-r from-[#FFECEF] to-[#FFF6F4] shadow-sm text-[#E46036]" : "text-gray-600 hover:bg-gray-50"
      }`}
      aria-pressed={activeTab === id}
    >
      <div className="w-9 h-9 flex items-center justify-center rounded-md bg-white border border-gray-100 shadow-sm">
        <Icon className={`w-4 h-4 ${activeTab === id ? "text-[#E46036]" : "text-gray-400"}`} />
      </div>
      <div className="text-left">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-gray-400">{id === "profile" ? "Name & info" : id === "email" ? "Change email" : id === "password" ? "Update password" : "Security & account"}</div>
      </div>
    </button>
  );

  return (
    <div className="min-h-[70vh] flex items-start justify-center bg-gray-50 p-6">
      <div className="w-full max-w-6xl grid grid-cols-12 gap-6">
        {/* Left: tabs */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            <div className="px-4 py-3 bg-gradient-to-r from-white to-white/60 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold">Account Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Manage profile, security & privacy</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setActiveTab("profile"); }}
                  className="text-xs px-3 py-1 rounded-full bg-white border text-gray-700"
                >
                  Quick Profile
                </button>
                <button
                  onClick={() => { refreshUser?.(); setAccountMessage({ type: "success", text: "Profile refreshed" }); }}
                  className="text-xs px-3 py-1 rounded-full bg-gray-50 border text-gray-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Tab id="profile" label="Profile" Icon={User} />
              <Tab id="email" label="Email" Icon={Mail} />
              <Tab id="password" label="Password" Icon={Lock} />
              <Tab id="account" label="Account" Icon={AlertTriangle} />
            </div>

            <div className="mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-white to-white/60 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-medium text-gray-800">Need help?</h4>
              <p className="text-xs text-gray-500 mt-1">Contact support if you need assistance with your account.</p>
            </div>
          </div>
        </aside>

        {/* Right: content */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {activeTab === "profile" && "Profile Information"}
                  {activeTab === "email" && "Change Email Address"}
                  {activeTab === "password" && "Change Password"}
                  {activeTab === "account" && "Account & Security"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "profile" && "Update your display name and visible profile information."}
                  {activeTab === "email" && "Update the email address associated with your account."}
                  {activeTab === "password" && "Change your password and keep your account secure."}
                  {activeTab === "account" && "Manage sessions and account deletion."}
                </p>
              </div>
            </div>
            {/* Body per tab */}
            {activeTab === "profile" && (
              <section className="space-y-4">
                <InlineMessage msg={profileMessage} />
                <form onSubmit={handleUpdateName} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#E46036] outline-none text-sm"
                      minLength={2}
                      maxLength={50}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Visible to others — 2–50 characters</p>
                  </div>

                  <div className="flex items-end gap-3 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={loadingProfile || !profileChanged}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                        profileChanged ? "bg-[#E46036] text-white hover:bg-[#cc4f2d]" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {loadingProfile ? "Saving..." : "Save Changes"}
                    </button>

                    {!profileChanged && <div className="text-sm text-gray-400">No changes</div>}
                  </div>
                </form>
              </section>
            )}

            {activeTab === "email" && (
              <section className="space-y-4">
                <InlineMessage msg={emailMessage} />
                {!showEmailVerification ? (
                  <form onSubmit={handleRequestEmailChange} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
                      <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                      <input
                        type="email"
                        value={emailData.email}
                        onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#E46036] text-sm outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={emailData.current_password}
                        onChange={(e) => setEmailData({ ...emailData, current_password: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#E46036] outline-none"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">Used to confirm your identity</p>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                      <button
                        type="submit"
                        disabled={loadingEmail || !emailHasChange}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                          emailHasChange ? "bg-[#E46036] text-white hover:bg-[#cc4f2d]" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        {loadingEmail ? "Sending..." : "Send Verification"}
                      </button>

                      <div className="text-sm text-gray-400">You will receive a 1-time code in the new email</div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailChange} className="space-y-3">
                    <div className="bg-blue-50 border border-blue-100 px-3 py-2 rounded-md text-sm text-blue-700">
                      A verification code was sent to <strong>{emailData.email}</strong>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                      <input
                        type="text"
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#E46036] outline-none"
                        placeholder="Paste verification code"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={loadingEmail} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E46036] text-white text-sm hover:bg-[#cc4f2d]">
                        <CheckCircle className="w-4 h-4" />
                        {loadingEmail ? "Verifying..." : "Verify Email"}
                      </button>

                      <button type="button" onClick={() => { setShowEmailVerification(false); setVerificationToken(""); }} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {activeTab === "password" && (
              <section className="space-y-4">
                <InlineMessage msg={passwordMessage} />
                <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#E46036] outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-3 text-gray-400">
                        {showPasswords.current ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.password}
                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#E46036] outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} className="absolute right-3 top-3 text-gray-400">
                        {showPasswords.new ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                      <div className={`w-24 h-2 rounded ${passwordStrength >= 1 ? "bg-yellow-400" : "bg-gray-200"}`} />
                      <div className={`w-24 h-2 rounded ${passwordStrength >= 3 ? "bg-yellow-500" : "bg-gray-200"}`} />
                      <div className={`w-24 h-2 rounded ${passwordStrength >= 4 ? "bg-green-400" : "bg-gray-200"}`} />
                      <div className="ml-2">Use mixed characters for a strong password</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.password_confirmation}
                        onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#E46036] outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-3 text-gray-400">
                        {showPasswords.confirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={loadingPassword} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E46036] text-white hover:bg-[#cc4f2d] text-sm">
                      <Lock className="w-4 h-4" />
                      {loadingPassword ? "Updating..." : "Update Password"}
                    </button>

                    {!passwordValidClient && <div className="text-sm text-gray-400">Password does not meet recommended strength.</div>}
                  </div>
                </form>
              </section>
            )}

            {activeTab === "account" && (
              <section className="space-y-4">
                {deletionStatus?.has_pending_deletion ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-900">Account Deletion Scheduled</h4>
                        <p className="text-sm text-red-800">Scheduled for: {new Date(deletionStatus.scheduled_deletion_at).toLocaleDateString()}</p>
                        <p className="text-sm text-red-700">Days remaining: <strong>{deletionStatus.days_remaining}</strong></p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={handleCancelDeletion} className="px-3 py-2 rounded-lg bg-red-600 text-white">Cancel Deletion</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border p-4">
                    <h4 className="font-semibold text-red-900">Delete Account</h4>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data. This can be canceled within 30 days.</p>
                    <form onSubmit={handleRequestDeletion} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                        <input type="password" value={deletionData.password} onChange={(e) => setDeletionData({ ...deletionData, password: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" required />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={deletionData.confirmation} onChange={(e) => setDeletionData({ ...deletionData, confirmation: e.target.checked })} className="w-4 h-4" required />
                          I understand this will delete my account and all data
                        </label>
                      </div>

                      <div className="md:col-span-2 flex items-center gap-3">
                        <button type="submit" disabled={loadingAccount || !deletionData.confirmation} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete Account</button>
                        <button type="button" onClick={() => { setDeletionData({ password: "", confirmation: false }); setAccountMessage(null); }} className="px-3 py-2 rounded-lg bg-gray-100">Reset</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Session Management</h4>
                      <p className="text-sm text-gray-500">Logout from all other devices except this one</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleLogoutAllDevices} disabled={loadingAccount} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Logout Others</button>
                      <button onClick={() => { refreshUser?.(); setAccountMessage({ type: "success", text: "Refreshed sessions." }); }} className="px-3 py-2 rounded-lg bg-gray-50 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    </div>
                  </div>

                  <InlineMessage msg={accountMessage} />
                </div>
              </section>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
