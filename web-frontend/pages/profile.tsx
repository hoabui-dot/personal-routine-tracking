import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import CapybaraFloating from '../components/CapybaraFloating';

const ProfilePage: React.FC = () => {
  const { user, logout, uploadAvatar, deleteAvatar } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getUserInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('[Profile Error] Failed to upload avatar:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your avatar?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteAvatar();
      toast.success('Avatar deleted successfully!');
    } catch (error) {
      console.error('[Profile Error] Failed to delete avatar:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      toast.error(error instanceof Error ? error.message : 'Failed to delete avatar');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  console.log('Profile page - User data:', user);
  console.log('Profile page - Avatar URL:', user.avatar_url);

  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Floating Capybara Decorations */}
          <CapybaraFloating position="top-right" size={100} />
          <CapybaraFloating position="bottom-left" size={120} />

          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: theme.surface,
              borderRadius: '1rem',
              boxShadow: `0 10px 25px ${theme.shadow}`,
              overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Header Section */}
            <div
              style={{
                background: 'linear-gradient(135deg, #d4845c 0%, #c97550 100%)', // Capybara warm orange
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  onClick={handleAvatarClick}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: !user.avatar_url ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    backdropFilter: 'blur(10px)',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {uploading ? (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      zIndex: 2
                    }}>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                          onLoad={() => {
                            console.log('Avatar image loaded successfully:', user.avatar_url);
                          }}
                          onError={(e) => {
                            console.error('Failed to load avatar image:', user.avatar_url);
                            console.error('Image error event:', e);
                            // Hide the broken image
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        getUserInitials(user.name)
                      )}
                      {/* Hover overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        zIndex: 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                      >
                        <svg
                          style={{ width: '32px', height: '32px', color: 'white' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                    </>
                  )}
                </div>

                {/* Delete button */}
                {user.avatar_url && !uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAvatar();
                    }}
                    disabled={deleting}
                    style={{
                      position: 'absolute',
                      bottom: '1.5rem',
                      right: 'calc(50% - 70px)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: theme.error,
                      border: '3px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                      opacity: deleting ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!deleting) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg
                      style={{ width: '18px', height: '18px', color: 'white' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '0.5rem',
                }}
              >
                {user.name}
              </h1>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {user.email}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '0.5rem',
                }}
              >
                Click avatar to upload new photo
              </p>
            </div>

            {/* Content Section */}
            <div style={{ padding: '2rem' }}>
              {/* Account Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg
                    style={{ width: '24px', height: '24px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Account Information
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* User ID */}
                  <div
                    style={{
                      padding: '1rem',
                      background: theme.background,
                      borderRadius: '0.5rem',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.25rem' }}>
                      User ID
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '500', color: theme.text }}>
                      #{user.id}
                    </div>
                  </div>

                  {/* Email Status */}
                  <div
                    style={{
                      padding: '1rem',
                      background: theme.background,
                      borderRadius: '0.5rem',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: theme.textSecondary, marginBottom: '0.25rem' }}>
                      Email Status
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.emailVerified ? (
                        <>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: theme.success,
                            }}
                          />
                          <span style={{ fontSize: '1rem', fontWeight: '500', color: theme.success }}>
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: theme.warning,
                            }}
                          />
                          <span style={{ fontSize: '1rem', fontWeight: '500', color: theme.warning }}>
                            Not Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => router.push('/calendar')}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #d4845c 0%, #c97550 100%)', // Capybara warm orange
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 132, 92, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg
                    style={{ width: '20px', height: '20px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Go to Calendar
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'transparent',
                    color: theme.error,
                    border: `2px solid ${theme.error}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.error;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.error;
                  }}
                >
                  <svg
                    style={{ width: '20px', height: '20px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProfilePage;
