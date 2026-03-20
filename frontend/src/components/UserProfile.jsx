import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaPhone, FaKey, FaMapMarkerAlt, FaBriefcase, FaMoneyBillWave, FaEdit, FaCamera } from 'react-icons/fa';
import './UserProfile.css';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { formatDateTime, toNepaliDigits, toEnglishDigits } from '../utils/nepaliFormat';
import WebcamCapture from './WebcamCapture';

const UserProfile = () => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertCurrency } = useNepaliNumber();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    occupation: '',
    annualIncome: '',
    idProof: 'citizenship',
    idProofNumber: '',
    profileImage: ''
  });

  const displayDigits = (value) => {
    if (!value) return t('user.profile.not_provided');
    return currentLng === 'ne' ? toNepaliDigits(value) : value;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await userAPI.getProfile();
      console.log('Profile response:', response.data);
      
      if (response.data.success) {
        setProfile(response.data.data);
        if (response.data.data) {
          setEditFormData({
            fullName: response.data.data.fullName || '',
            phoneNumber: response.data.data.phoneNumber || '',
            address: response.data.data.address || '',
            occupation: response.data.data.occupation || '',
            annualIncome: response.data.data.annualIncome || '',
            idProof: response.data.data.idProof || 'citizenship',
            idProofNumber: response.data.data.idProofNumber || '',
            profileImage: response.data.data.profileImage || ''
          });
        }
        setError('');
      } else {
        setError(response.data.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('user.profile.password_modal.error.mismatch'));
      return;
    }

    try {
      const response = await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setPasswordSuccess(t('user.profile.password_modal.success'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPasswordError(response.data.message || t('user.profile.password_modal.error.failed'));
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || t('user.profile.password_modal.error.failed'));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    const englishValue = toEnglishDigits(value);
    setEditFormData({ ...editFormData, [name]: englishValue });
  };

  const handleEditFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditWebcamCapture = (imageBase64) => {
    setEditFormData({ ...editFormData, profileImage: imageBase64 });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await userAPI.updateProfile(editFormData);
      if (response.data.success) {
        setProfile({ ...profile, ...editFormData });
        setShowEditModal(false);
      } else {
        alert(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const role = localStorage.getItem('userRole');

  return (
    <div className="user-profile fade-in">
      {error && <div className="error-message">{error}</div>}
      
      <h1>{t('user.profile.title')}</h1>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt={profile.username} className="avatar-image" />
            ) : (
              <FaUser />
            )}
          </div>
          <h2>{profile?.username || t('user.profile.fields.username')}</h2>
          <p className="profile-role">{t(`roles.${profile?.role || role}`)}</p>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <FaEnvelope className="detail-icon" />
            <div>
              <label>{t('user.profile.fields.email')}</label>
              <p>{profile?.email || t('user.profile.not_provided')}</p>
            </div>
          </div>

          <div className="detail-item">
            <FaPhone className="detail-icon" />
            <div>
              <label>{t('user.profile.fields.phone')}</label>
              <p>{displayDigits(profile?.phoneNumber)}</p>
            </div>
          </div>

          {role === 'CUSTOMER' && (
            <>
              <div className="detail-item">
                <FaUser className="detail-icon" />
                <div>
                  <label>{t('user.profile.fields.full_name')}</label>
                  <p>{profile?.fullName || t('user.profile.not_provided')}</p>
                </div>
              </div>

              <div className="detail-item">
                <FaMapMarkerAlt className="detail-icon" />
                <div>
                  <label>{t('user.profile.fields.address')}</label>
                  <p>{profile?.address || t('user.profile.not_provided')}</p>
                </div>
              </div>

              <div className="detail-item">
                <FaBriefcase className="detail-icon" />
                <div>
                  <label>{t('user.profile.fields.occupation')}</label>
                  <p>{profile?.occupation || t('user.profile.not_provided')}</p>
                </div>
              </div>

              <div className="detail-item">
                <FaMoneyBillWave className="detail-icon" />
                <div>
                  <label>{t('user.profile.fields.annual_income')}</label>
                  <p>{convertCurrency(profile?.annualIncome) || t('user.profile.not_provided')}</p>
                </div>
              </div>

              <div className="detail-item">
                <FaKey className="detail-icon" />
                <div>
                  <label>{t('user.profile.fields.id_proof')}</label>
                  <p>{profile?.idProof ? `${t(`customers.id_proof_types.${profile.idProof}`)} - ${displayDigits(profile.idProofNumber)}` : t('user.profile.not_provided')}</p>
                </div>
              </div>
            </>
          )}

          <div className="detail-item">
            <FaKey className="detail-icon" />
            <div>
              <label>{t('user.profile.fields.account_status')}</label>
              <p className={profile?.active ? 'active-status' : 'inactive-status'}>
                {profile?.active ? t('user.profile.status.active') : t('user.profile.status.inactive')}
              </p>
            </div>
          </div>

          {profile?.createdAt && (
            <div className="detail-item">
              <FaKey className="detail-icon" />
              <div>
                <label>{t('customers.created')}</label>
                <p>{formatDateTime(profile?.createdAt, currentLng)}</p>
              </div>
            </div>
          )}
        </div>

        <button className="edit-profile-btn" onClick={() => setShowEditModal(true)} style={{ marginRight: '10px' }}>
          <FaEdit /> {t('user.profile.edit_profile')}
        </button>

        <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
          {t('user.profile.change_password')}
        </button>
      </div>

      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('user.profile.edit_profile')}</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="image-upload-group" style={{ width: '100%', marginBottom: '10px' }}>
                  <label>{t('customers.profile_image')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {editFormData.profileImage && (
                      <img src={editFormData.profileImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="profile-image-input"
                      style={{ display: 'none' }}
                      onChange={handleEditFileUpload}
                    />
                    <button type="button" onClick={() => document.getElementById('profile-image-input').click()} className="file-upload-btn">
                      {t('common.choose_file')}
                    </button>
                    {editFormData.profileImage && (
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>{t('common.file_selected')}</span>
                    )}
                    <button type="button" onClick={() => setShowWebcam(true)} className="camera-btn">
                      <FaCamera /> {t('common.capture')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="fullName"
                  placeholder={t('customers.full_name')}
                  value={editFormData.fullName}
                  onChange={handleEditInputChange}
                  required
                />
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder={t('customers.phone')}
                  value={displayDigits(editFormData.phoneNumber)}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="address"
                  placeholder={t('customers.address')}
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  required
                />
                <select
                  name="idProof"
                  value={editFormData.idProof}
                  onChange={handleEditInputChange}
                >
                  <option value="citizenship">{t('customers.id_proof_types.citizenship')}</option>
                  <option value="passport">{t('customers.id_proof_types.passport')}</option>
                  <option value="driving_license">{t('customers.id_proof_types.driving_license')}</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="idProofNumber"
                  placeholder={t('customers.id_proof_number')}
                  value={displayDigits(editFormData.idProofNumber)}
                  onChange={handleEditInputChange}
                  required
                />
                <input
                  type="text"
                  name="occupation"
                  placeholder={t('customers.occupation')}
                  value={editFormData.occupation}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="annualIncome"
                  placeholder={t('customers.annual_income')}
                  value={displayDigits(editFormData.annualIncome)}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('user.profile.password_modal.title')}</h2>
            <form onSubmit={handleSubmitPassword}>
              <div className="form-row">
                <input
                  type="password"
                  name="currentPassword"
                  placeholder={t('user.profile.password_modal.current')}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="password"
                  name="newPassword"
                  placeholder={t('user.profile.password_modal.new')}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-row">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={t('user.profile.password_modal.confirm')}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                />
              </div>

              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {t('user.profile.change_password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWebcam && (
        <WebcamCapture
          onCapture={handleEditWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;