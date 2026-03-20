import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LoanRequest.css';
import { FaPlus, FaTrash, FaFile, FaSignature, FaImage, FaCamera } from 'react-icons/fa';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { toEnglishDigits, toNepaliDigits } from '../utils/nepaliFormat';
import WebcamCapture from './WebcamCapture';

const LoanRequest = () => {
  const { t, i18n } = useTranslation();
  const { convertNumber } = useNepaliNumber();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [goldItems, setGoldItems] = useState([
    {
      itemType: 'Necklace',
      weightInGrams: '',
      purity: '22K',
      description: '',
      estimatedValue: '',
      serialNumber: '',
      imageUrl: '',
      billAttachments: [],
      customerSignature: ''
    }
  ]);

  const [showWebcam, setShowWebcam] = useState(null);

  const [formData, setFormData] = useState({
    principalAmount: '',
    tenureMonths: ''
  });

  const [imageFiles, setImageFiles] = useState({});
  const [billFiles, setBillFiles] = useState({});
  const [signatureFiles, setSignatureFiles] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [billPreviews, setBillPreviews] = useState({});
  const [signaturePreviews, setSignaturePreviews] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const englishValue = toEnglishDigits(value);
    setFormData({
      ...formData,
      [name]: englishValue
    });
  };

  const handleGoldItemChange = (index, e) => {
    const { name, value } = e.target;
    const englishValue = toEnglishDigits(value);
    const updatedItems = [...goldItems];
    updatedItems[index][name] = englishValue;
    setGoldItems(updatedItems);
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedImageFiles = { ...imageFiles, [index]: file };
      setImageFiles(updatedImageFiles);

      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPreviews = { ...imagePreviews, [index]: reader.result };
        setImagePreviews(updatedPreviews);

        const updatedItems = [...goldItems];
        updatedItems[index].imageUrl = reader.result;
        setGoldItems(updatedItems);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (index, imageBase64) => {
    const updatedItems = [...goldItems];
    updatedItems[index].imageUrl = imageBase64;
    setGoldItems(updatedItems);

    const updatedPreviews = { ...imagePreviews, [index]: imageBase64 };
    setImagePreviews(updatedPreviews);

    const updatedImageFiles = { ...imageFiles };
    delete updatedImageFiles[index];
    setImageFiles(updatedImageFiles);
  };

  const handleBillUpload = (index, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const updatedBillFiles = { ...billFiles, [index]: files };
      setBillFiles(updatedBillFiles);

      const promises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(base64Files => {
        const updatedPreviews = { ...billPreviews, [index]: base64Files };
        setBillPreviews(updatedPreviews);

        const updatedItems = [...goldItems];
        updatedItems[index].billAttachments = base64Files;
        setGoldItems(updatedItems);
      });
    }
  };

  const handleSignatureUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedSignatureFiles = { ...signatureFiles, [index]: file };
      setSignatureFiles(updatedSignatureFiles);

      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPreviews = { ...signaturePreviews, [index]: reader.result };
        setSignaturePreviews(updatedPreviews);

        const updatedItems = [...goldItems];
        updatedItems[index].customerSignature = reader.result;
        setGoldItems(updatedItems);
      };
      reader.readAsDataURL(file);
    }
  };

  const addGoldItem = () => {
    setGoldItems([
      ...goldItems,
      {
        itemType: 'Necklace',
        weightInGrams: '',
        purity: '22K',
        description: '',
        estimatedValue: '',
        serialNumber: '',
        imageUrl: '',
        billAttachments: [],
        customerSignature: ''
      }
    ]);
  };

  const removeGoldItem = (index) => {
    if (goldItems.length > 1) {
      const updatedItems = goldItems.filter((_, i) => i !== index);
      setGoldItems(updatedItems);

      const newImagePreviews = { ...imagePreviews };
      delete newImagePreviews[index];
      setImagePreviews(newImagePreviews);

      const newBillPreviews = { ...billPreviews };
      delete newBillPreviews[index];
      setBillPreviews(newBillPreviews);

      const newSignaturePreviews = { ...signaturePreviews };
      delete newSignaturePreviews[index];
      setSignaturePreviews(newSignaturePreviews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    for (let i = 0; i < goldItems.length; i++) {
      const item = goldItems[i];
      if (!item.weightInGrams || !item.estimatedValue) {
        setError(t('loan_request.validation.fill_all', { number: i + 1 }));
        setLoading(false);
        return;
      }
    }

    if (!formData.tenureMonths || parseInt(formData.tenureMonths) < 1 || parseInt(formData.tenureMonths) > 36) {
      setError(t('loan_request.validation.valid_tenure'));
      setLoading(false);
      return;
    }

    const loanData = {
      principalAmount: parseFloat(formData.principalAmount),
      tenureMonths: parseInt(formData.tenureMonths),
      goldItems: goldItems.map(item => ({
        itemType: item.itemType,
        weightInGrams: parseFloat(item.weightInGrams),
        purity: item.purity,
        description: item.description || '',
        estimatedValue: parseFloat(item.estimatedValue),
        serialNumber: item.serialNumber || '',
        imageUrl: item.imageUrl || '',
        billAttachments: item.billAttachments || [],
        customerSignature: item.customerSignature || ''
      }))
    };

    console.log('Submitting loan request:', loanData);

    try {
      const response = await userAPI.requestLoan(loanData);
      console.log('Loan request response:', response.data);

      if (response.data.success) {
        setSuccess(t('loan_request.success'));
        setTimeout(() => {
          navigate('/user/my-loans');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to submit loan request');
      }
    } catch (err) {
      console.error('Failed to submit loan request:', err);
      setError(err.response?.data?.message || 'Failed to submit loan request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value) => {
    if (!value) return '';
    return i18n.language === 'ne' ? toNepaliDigits(value) : value;
  };

  return (
    <div className="loan-request-container fade-in">
      <h1>{t('loan_request.title')}</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="loan-request-form">
        <div className="form-section">
          <h2>{t('loan_request.loan_details')}</h2>

          <div className="form-row">
            <div className="form-group">
              <label>{t('loan_request.principal_amount')}</label>
              <input
                type="text"
                name="principalAmount"
                value={displayValue(formData.principalAmount)}
                onChange={handleInputChange}
                placeholder={t('loan_request.principal_amount')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('loan_request.tenure')}</label>
              <input
                type="text"
                name="tenureMonths"
                value={displayValue(formData.tenureMonths)}
                onChange={handleInputChange}
                placeholder={t('loan_request.tenure')}
                required
              />
            </div>
          </div>

          <div className="info-message">
            <p dangerouslySetInnerHTML={{ __html: t('loan_request.interest_info') }} />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>{t('loan_request.gold_items_section')}</h2>
            <button type="button" className="add-item-btn" onClick={addGoldItem}>
              <FaPlus /> {t('loan_request.add_gold_item')}
            </button>
          </div>

          {goldItems.map((item, index) => (
            <div key={index} className="gold-item-card">
              <div className="gold-item-header">
                <h3>{t('loan_request.gold_item', { number: index + 1 })}</h3>
                {goldItems.length > 1 && (
                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => removeGoldItem(index)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('loan_request.fields.item_type')}</label>
                  <select
                    name="itemType"
                    value={item.itemType}
                    onChange={(e) => handleGoldItemChange(index, e)}
                  >
                    <option value="Necklace">{t('item_types.Necklace')}</option>
                    <option value="Ring">{t('item_types.Ring')}</option>
                    <option value="Earring">{t('item_types.Earring')}</option>
                    <option value="Bracelet">{t('item_types.Bracelet')}</option>
                    <option value="Chain">{t('item_types.Chain')}</option>
                    <option value="Coin">{t('item_types.Coin')}</option>
                    <option value="Other">{t('item_types.Other')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('loan_request.fields.weight')}</label>
                  <input
                    type="text"
                    name="weightInGrams"
                    value={displayValue(item.weightInGrams)}
                    onChange={(e) => handleGoldItemChange(index, e)}
                    placeholder={t('loan_request.fields.weight')}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('loan_request.fields.purity')}</label>
                  <select
                    name="purity"
                    value={item.purity}
                    onChange={(e) => handleGoldItemChange(index, e)}
                  >
                    <option value="24K">24K (99.9%)</option>
                    <option value="22K">22K (91.6%)</option>
                    <option value="18K">18K (75%)</option>
                    <option value="14K">14K (58.5%)</option>
                    <option value="10K">10K (41.7%)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('loan_request.fields.estimated_value')}</label>
                  <input
                    type="text"
                    name="estimatedValue"
                    value={displayValue(item.estimatedValue)}
                    onChange={(e) => handleGoldItemChange(index, e)}
                    placeholder={t('loan_request.fields.estimated_value')}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('loan_request.fields.serial_number')}</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={displayValue(item.serialNumber)}
                    onChange={(e) => handleGoldItemChange(index, e)}
                    placeholder={t('loan_request.fields.serial_number')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('loan_request.fields.description')}</label>
                  <input
                    type="text"
                    name="description"
                    value={item.description}
                    onChange={(e) => handleGoldItemChange(index, e)}
                    placeholder={t('loan_request.fields.description')}
                  />
                </div>
              </div>

              <div className="upload-section">
                <h4>{t('loan_request.upload.title')}</h4>

                <div className="upload-row">
                  <div className="upload-group">
                    <label className="upload-label">
                      <FaImage /> {t('loan_request.upload.gold_image')}
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id={`gold-image-${index}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                      <button type="button" onClick={() => document.getElementById(`gold-image-${index}`).click()} className="file-upload-btn">
                        {t('common.choose_file')}
                      </button>
                      {imagePreviews[index] && (
                        <span>{t('common.file_selected')}</span>
                      )}
                      <button type="button" onClick={() => setShowWebcam(index)} className="camera-btn">
                        <FaCamera />
                      </button>
                    </div>
                    {imagePreviews[index] && (
                      <div className="preview-container">
                        <img src={imagePreviews[index]} alt="Gold item" className="preview-image" />
                      </div>
                    )}
                  </div>

                  <div className="upload-group">
                    <label className="upload-label">
                      <FaSignature /> {t('loan_request.upload.signature')}
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id={`signature-${index}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleSignatureUpload(index, e)}
                      />
                      <button type="button" onClick={() => document.getElementById(`signature-${index}`).click()} className="file-upload-btn">
                        {t('common.choose_file')}
                      </button>
                      {signaturePreviews[index] && (
                        <span>{t('common.file_selected')}</span>
                      )}
                    </div>
                    {signaturePreviews[index] && (
                      <div className="preview-container">
                        <img src={signaturePreviews[index]} alt="Signature" className="preview-signature" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="upload-group full-width">
                  <label className="upload-label">
                    <FaFile /> {t('loan_request.upload.bills')}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      id={`bills-${index}`}
                      style={{ display: 'none' }}
                      onChange={(e) => handleBillUpload(index, e)}
                    />
                    <button type="button" onClick={() => document.getElementById(`bills-${index}`).click()} className="file-upload-btn">
                      {t('common.choose_file')}
                    </button>
                    {billPreviews[index] && (
                      <span>{t('common.files_selected', { count: billPreviews[index].length })}</span>
                    )}
                  </div>
                  {billPreviews[index] && (
                    <div className="bill-previews">
                      <ul>
                        {billPreviews[index].map((_, i) => (
                          <li key={i}>{t('common.bill')} {i + 1}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/user/my-loans')}>
            {t('loan_request.cancel')}
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t('loan_request.submitting') : t('loan_request.submit')}
          </button>
        </div>
      </form>

      {showWebcam !== null && (
        <WebcamCapture
          onCapture={(imageBase64) => {
            handleWebcamCapture(showWebcam, imageBase64);
            setShowWebcam(null);
          }}
          onClose={() => setShowWebcam(null)}
        />
      )}
    </div>
  );
};

export default LoanRequest;