import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function Settings() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile State
  const [profileData, setProfileData] = useState({
    name: "",
  });

  // Email Change State
  const [emailData, setEmailData] = useState({
    email: "",
    current_password: "",
  });
  const [verificationToken, setVerificationToken] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Account Deletion State
  const [deletionData, setDeletionData] = useState({
    password: "",
    confirmation: false,
  });
  const [deletionStatus, setDeletionStatus] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || "" });
    }
    fetchDeletionStatus();
  }, [user]);

  // Fetch deletion status
  const fetchDeletionStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(`${API_URL}/user/deletion-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setDeletionStatus(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch deletion status:", error);
    }
  };

  // Update Name
  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.put(
        `${API_URL}/user/profile/name`,
        { name: profileData.name },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-CSRF-TOKEN': getCSRFToken()
          } 
        }
      );

      if (response.data.success) {
        // Update the user in context and localStorage
        if (response.data.data.user) {
          updateUser(response.data.data.user); // This updates both state and localStorage
        }
        
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Name updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update name",
      });
    } finally {
      setLoading(false);
    }
  };

  // Request Email Change
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        `${API_URL}/user/email/request-change`,
        emailData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowEmailVerification(true);
        Swal.fire({
          icon: "info",
          title: "Verification Sent",
          text: "Please check your new email for the verification code",
          confirmButtonColor: "#E46036",
        });
        // Clear password field for security
        setEmailData({ ...emailData, current_password: "" });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to request email change",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify Email Change
  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        `${API_URL}/user/email/verify`,
        { token: verificationToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the user in context and localStorage
        if (response.data.data.user) {
          updateUser(response.data.data.user);
        }

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Email updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        
        setShowEmailVerification(false);
        setVerificationToken("");
        setEmailData({ email: "", current_password: "" });
        
        // NO MORE window.location.reload()!
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Invalid verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.password_confirmation) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.put(
        `${API_URL}/user/password`,
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        setPasswordData({
          current_password: "",
          password: "",
          password_confirmation: "",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

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

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.post(
          `${API_URL}/user/logout-all`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: response.data.message,
          timer: 2000,
          showConfirmButton: false,
        });

      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to logout from all devices",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Request Account Deletion
  const handleRequestDeletion = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Delete Account?",
      html: `
        <p>This will schedule your account for deletion in 30 days.</p>
        <p class="text-sm text-gray-600 mt-2">You can cancel this at any time within the 30-day period.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete my account",
    });

    if (result.isConfirmed) {
      setLoading(true);

      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.post(
          `${API_URL}/user/account/delete`,
          deletionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deletion Requested",
            text: `Account will be deleted in 30 days`,
            confirmButtonColor: "#E46036",
          });
          fetchDeletionStatus();
          setDeletionData({ password: "", confirmation: false });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to request deletion",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Cancel Account Deletion
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

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.post(
          `${API_URL}/user/account/cancel-delete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deletion Cancelled",
            text: "Your account is no longer scheduled for deletion",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchDeletionStatus();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to cancel deletion",
        });
      }
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? "bg-[#E46036] text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton id="profile" label="Profile" icon={User} />
        <TabButton id="email" label="Email" icon={Mail} />
        <TabButton id="password" label="Password" icon={Lock} />
        <TabButton id="account" label="Account" icon={AlertTriangle} />
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Information
          </h3>
          <form onSubmit={handleUpdateName}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                required
                minLength={2}
                maxLength={50}
              />
              <p className="text-sm text-gray-500 mt-1">
                Your display name (2-50 characters)
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Change your email in the Email tab
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === "email" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Change Email Address
          </h3>

          {!showEmailVerification ? (
            <form onSubmit={handleRequestEmailChange}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) =>
                    setEmailData({ ...emailData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailData.current_password}
                  onChange={(e) =>
                    setEmailData({
                      ...emailData,
                      current_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required for security verification
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailChange}>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  A verification code has been sent to <strong>{emailData.email}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent font-mono"
                  placeholder="Enter 64-character code"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailVerification(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password
          </h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Min 8 characters, uppercase, lowercase, number, symbol
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.password_confirmation}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      password_confirmation: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Deletion Warning */}
          {deletionStatus?.has_pending_deletion && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Account Deletion Scheduled
                  </h3>
                  <p className="text-red-800 mb-2">
                    Your account is scheduled for deletion in{" "}
                    <strong>{deletionStatus.days_remaining} days</strong>
                  </p>
                  <p className="text-sm text-red-700 mb-4">
                    Scheduled for:{" "}
                    {new Date(
                      deletionStatus.scheduled_deletion_at
                    ).toLocaleDateString()}
                  </p>
                  <button
                    onClick={handleCancelDeletion}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel Deletion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logout All Devices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Session Management
            </h3>
            <p className="text-gray-600 mb-4">
              Logout from all devices except this one
            </p>
            <button
              onClick={handleLogoutAllDevices}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Logout All Devices"}
            </button>
          </div>

          {/* Delete Account */}
          {!deletionStatus?.has_pending_deletion && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Delete Account
              </h3>
              <p className="text-gray-600 mb-4">
                Permanently delete your account and all data. This action can be
                cancelled within 30 days.
              </p>

              <form onSubmit={handleRequestDeletion}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={deletionData.password}
                    onChange={(e) =>
                      setDeletionData({
                        ...deletionData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionData.confirmation}
                      onChange={(e) =>
                        setDeletionData({
                          ...deletionData,
                          confirmation: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I understand this will delete my account and all data
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !deletionData.confirmation}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : "Delete Account"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}