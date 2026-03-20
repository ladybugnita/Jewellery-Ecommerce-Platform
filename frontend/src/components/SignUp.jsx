import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { toEnglishDigits } from '../utils/nepaliFormat';
import './SignUp.css';
import { FaGem, FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const SignUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    fullName: '',
    address: '',
    idProof: 'citizenship',
    idProofNumber: '',
    occupation: '',
    annualIncome: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.password_mismatch'));
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.signup({
        ...formData,
        phoneNumber: toEnglishDigits(formData.phoneNumber),
        annualIncome: formData.annualIncome
          ? parseFloat(toEnglishDigits(formData.annualIncome))
          : 0
      });

      if (response.data.success) {
        setSuccess(t('auth.registration_success'));
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <FaGem className="signup-icon" />
          <h1>{t('auth.signup_title')}</h1>
          <p>{t('auth.signup_subtitle')}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="username"
                placeholder={t('auth.username')}
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder={t('auth.confirm_password')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <FaPhone className="input-icon" />
              <input
                type="tel"
                name="phoneNumber"
                placeholder={t('auth.phone')}
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="fullName"
                placeholder={t('auth.fullname')}
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group full-width">
              <FaMapMarkerAlt className="input-icon" />
              <input
                type="text"
                name="address"
                placeholder={t('auth.address')}
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <select
                name="idProof"
                value={formData.idProof}
                onChange={handleChange}
                className="id-proof-select"
              >
                <option value="citizenship">{t('customers.id_proof_types.citizenship')}</option>
                <option value="passport">{t('customers.id_proof_types.passport')}</option>
                <option value="driving_license">{t('customers.id_proof_types.driving_license')}</option>
              </select>
            </div>

            <div className="input-group">
              <input
                type="text"
                name="idProofNumber"
                placeholder={t('auth.id_proof_number')}
                value={formData.idProofNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <input
                type="text"
                name="occupation"
                placeholder={t('auth.occupation')}
                value={formData.occupation}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                name="annualIncome"
                placeholder={t('auth.annual_income')}
                value={formData.annualIncome}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? t('auth.signing_up') : t('auth.signup_btn')}
          </button>
        </form>

        <div className="signup-footer">
          <p>{t('auth.have_account')} <Link to="/login">{t('auth.login_btn')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;