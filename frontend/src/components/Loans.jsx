import React, { useState, useEffect, useCallback } from 'react';
import './Loans.css';
import WebcamCapture from './WebcamCapture';
import { FaCamera } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaUniversity,
  FaUser,
  FaCalendarAlt,
  FaPercentage,
  FaRupeeSign,
  FaGem,
  FaChartLine,
  FaRegCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { 
  formatCurrency, 
  formatNumberNepali, 
  formatWeight, 
  formatDateTime, 
  formatPercent, 
  toNepaliDigits,
  toEnglishDigits,
  formatDate
} from '../utils/nepaliFormat';

const formatDateWithNepali = (dateString) => {
  if (!dateString) return { english: 'N/A', nepali: 'N/A' };
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { english: 'Invalid Date', nepali: 'अमान्य मिति' };
    
    const english = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const nepali = formatDate(dateString, 'ne');
    
    return { english, nepali };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { english: 'Error', nepali: 'त्रुटि' };
  }
};

const Loans = ({ token }) => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertNumber, convertCurrency, convertWeight, convertPercentage } = useNepaliNumber();
  const [activeTab, setActiveTab] = useState('customer');
  const [customerLoans, setCustomerLoans] = useState([]);
  const [bankLoans, setBankLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [goldItems, setGoldItems] = useState([]);
  const [availableGoldItems, setAvailableGoldItems] = useState([]);
  const [selectedGoldItems, setSelectedGoldItems] = useState([]);
  const [selectedGoldItemsDetails, setSelectedGoldItemsDetails] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [individualCalculations, setIndividualCalculations] = useState([]);
  const [showCalculationsModal, setShowCalculationsModal] = useState(false);
  const [selectedBankLoan, setSelectedBankLoan] = useState(null);
  const [loadingGoldItems, setLoadingGoldItems] = useState(false);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loanToApprove, setLoanToApprove] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalAction, setApprovalAction] = useState(null);
  const [approvalDetails, setApprovalDetails] = useState({
    principalAmount: '',
    interestRate: ''
  });
  const [loadingPending, setLoadingPending] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [serialNumber, setSerialNumber] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [showMonthlyBreakdownModal, setShowMonthlyBreakdownModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [canUserApprove, setCanUserApprove] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [customerGoldItems, setCustomerGoldItems] = useState([]);
  const [loadingCustomerGold, setLoadingCustomerGold] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    principalAmount: '',
    interestRate: '',
    tenureMonths: '',
    goldItemIds: [],
    interestType: 'COMPOUND',
    customerSerialNumber: '',
    autoGenerateSerialNumber: true,
    
    bankName: '',
    principalAmountBank: '',
    interestRateBank: '',
    tenureMonthsBank: '',
    goldItemIdsBank: [],
    bankSerialNumber: '',
    bankGoldImages: [],
    customerSerialNumbersBank: ''
  });

  const displayPurity = (purity) => {
    if (!purity) return '';
    return currentLng === 'ne' ? toNepaliDigits(purity) : purity;
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
  };

  const fetchUserPermissions = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole');
      
      if (role !== 'ADMIN' && role !== 'STAFF') {
        setCanUserApprove(false);
        return;
      }
      
      if (!userId) {
        setCanUserApprove(false);
        return;
      }
      
      const response = await adminAPI.getUserById(userId);
      if (response.data && response.data.data) {
        setUserPermissions(response.data.data);
        const canApprove = response.data.data.canApproveLoans || false;
        setCanUserApprove(canApprove);
      }
    } catch (err) {
      console.error('Failed to fetch user permissions:', err);
      setCanUserApprove(false);
    }
  }, []);

  const fetchPendingLoans = useCallback(async () => {
    const role = localStorage.getItem('userRole');
    
    if (role !== 'ADMIN' && role !== 'STAFF') {
      setPendingLoans([]);
      return;
    }

    setLoadingPending(true);
    try {
      const response = await adminAPI.getPendingApprovalLoans();
      if (response.data && response.data.data) {
        setPendingLoans(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setPendingLoans([]);
      }
    } catch (err) {
      console.error('Failed to fetch pending loans:', err);
      setPendingLoans([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchCustomerLoans = useCallback(async () => {
    try {
      const response = await adminAPI.getCustomerLoans();
      const loans = Array.isArray(response.data.data) ? response.data.data : [];
      setCustomerLoans(loans);
      return loans;
    } catch (err) {
      console.error('Failed to fetch customer loans:', err);
      setCustomerLoans([]);
      return [];
    }
  }, []);

  const fetchBankLoans = useCallback(async () => {
    try {
      const response = await adminAPI.getBankLoans();
      setBankLoans(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch bank loans:', err);
      setBankLoans([]);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  }, []);

  const fetchGoldItems = useCallback(async () => {
    try {
      const response = await adminAPI.getGoldItems();
      const items = Array.isArray(response.data.data) ? response.data.data : [];
      setGoldItems(items);
    } catch (err) {
      console.error('Failed to fetch gold items:', err);
      setGoldItems([]);
    }
  }, []);

  const fetchCustomerGoldItems = useCallback(async (customerId) => {
    if (!customerId) {
      setCustomerGoldItems([]);
      return;
    }
    setLoadingCustomerGold(true);
    try {
      const response = await adminAPI.getAvailableGoldItemsByCustomer(customerId);
      console.log('Customer gold items API response:', response.data);
      let items = [];
      if (response.data && response.data.data) {
        items = response.data.data;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else {
        items = [];
      }
      
      setCustomerGoldItems(items);
      if (items.length === 0) {
        console.log('No available gold items found for customer:', customerId);
      }
    } catch (err) {
      console.error('Failed to fetch customer gold items:', err);
      setCustomerGoldItems([]);
    } finally {
      setLoadingCustomerGold(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCustomerLoans(),
        fetchBankLoans(),
        fetchCustomers(),
        fetchGoldItems()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCustomerLoans, fetchBankLoans, fetchCustomers, fetchGoldItems]);

  const fetchAvailableGoldItemsForBank = useCallback(async () => {
    setLoadingGoldItems(true);
    try {
      const pledgedItems = goldItems.filter(item => 
        item.status === 'PLEDGED' || item.status === 'PLEDGED_TO_CUSTOMER'
      );
      
      const formattedItems = pledgedItems.map(item => {
        const customer = customers.find(c => c.id === item.customerId);
        
        return {
          id: item.id,
          itemType: item.itemType,
          weightInGrams: item.weightInGrams,
          purity: item.purity,
          estimatedValue: item.estimatedValue,
          serialNumber: item.serialNumber,
          customerId: item.customerId,
          customerLoanId: item.customerLoanId,
          customerName: customer ? customer.fullName : 'Unknown',
          imageUrl: item.imageUrl,
          loanNumber: item.loanNumber,
          customerSerialNumber: item.customerSerialNumber
        };
      });
      
      setAvailableGoldItems(formattedItems);
    } catch (err) {
      console.error('Failed to fetch available gold items:', err);
      setAvailableGoldItems([]);
    } finally {
      setLoadingGoldItems(false);
    }
  }, [goldItems, customers]);

  useEffect(() => {
    fetchAllData();
    
    const currentUserRole = localStorage.getItem('userRole');
    setUserRole(currentUserRole);
    
    if (currentUserRole === 'ADMIN' || currentUserRole === 'STAFF') {
      fetchUserPermissions();
    } else {
      setCanUserApprove(false);
    }
  }, [fetchAllData, fetchUserPermissions]);

  useEffect(() => {
    if (goldItems.length > 0) {
      fetchAvailableGoldItemsForBank();
    }
  }, [goldItems, fetchAvailableGoldItemsForBank]);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingLoans();
    }
  }, [activeTab, fetchPendingLoans]);

  const searchLoans = async () => {
    try {
      if (searchType === 'serial' && serialNumber) {
        if (activeTab === 'customer') {
          const response = await adminAPI.getCustomerLoanBySerialNumber(serialNumber);
          setCustomerLoans([response.data.data]);
        } else if (activeTab === 'bank') {
          const response = await adminAPI.getBankLoanBySerialNumber(serialNumber);
          setBankLoans([response.data.data]);
        }
      } else {
        if (activeTab === 'customer') {
          const response = await adminAPI.searchCustomerLoans(null, searchTerm);
          setCustomerLoans(response.data.data);
        } else if (activeTab === 'bank') {
          const response = await adminAPI.searchBankLoans(null, searchTerm);
          setBankLoans(response.data.data);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      if (activeTab === 'customer') {
        setCustomerLoans([]);
      } else if (activeTab === 'bank') {
        setBankLoans([]);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, option => option.value);
      setFormData({ ...formData, [name]: values });
    } else {
      const englishValue = toEnglishDigits(value);
      setFormData({ ...formData, [name]: englishValue });
    }

    if (name === 'customerId') {
      fetchCustomerGoldItems(value);
      setFormData(prev => ({ ...prev, goldItemIds: [] }));
    }
  };

  const handleWebcamCaptureForBank = (imageBase64) => {
    setImagePreviews([...imagePreviews, imageBase64]);
    setFormData({
      ...formData,
      bankGoldImages: [...formData.bankGoldImages, imageBase64]
    });
  };

  const handleGoldItemSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedGoldItems(selectedOptions);
    
    const selectedItems = availableGoldItems.filter(item => 
      selectedOptions.includes(item.id)
    );
    
    setSelectedGoldItemsDetails(selectedItems);
    
    const customerSerials = selectedItems
      .map(item => item.customerSerialNumber)
      .filter(number => number)
      .join(', ');

    setFormData({
      ...formData,
      goldItemIdsBank: selectedOptions,
      customerSerialNumbersBank: customerSerials
    });
  };

  const handleBankGoldImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const promises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(base64Files => {
        setImagePreviews(base64Files);
        setFormData({
          ...formData,
          bankGoldImages: base64Files
        });
      });
    }
  };

  const handleSubmitCustomerLoan = async (e) => {
    e.preventDefault();

    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(interestRate) || interestRate < 0.1) {
      alert('Interest rate must be at least 0.1%');
      return;
    }

    try {
      const loanData = {
        customerId: formData.customerId,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: interestRate,
        tenureMonths: parseInt(formData.tenureMonths),
        goldItemIds: formData.goldItemIds,
        interestType: formData.interestType,
        customerSerialNumber: formData.customerSerialNumber,
        autoGenerateSerialNumber: formData.autoGenerateSerialNumber
      };
      
      await adminAPI.createCustomerLoan(loanData);
      fetchCustomerLoans();
      resetForm();
      setShowModal(false);
      alert('Customer loan created successfully!');
    } catch (err) {
      console.error('Failed to create customer loan:', err);
      alert('Failed to create loan: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmitBankLoan = async (e) => {
    e.preventDefault();
    try {
      const loanData = {
        bankName: formData.bankName,
        principalAmount: parseFloat(formData.principalAmountBank),
        interestRate: parseFloat(formData.interestRateBank),
        tenureMonths: parseInt(formData.tenureMonthsBank),
        goldItemIds: formData.goldItemIdsBank,
        bankSerialNumber: formData.bankSerialNumber,
        bankGoldImages: formData.bankGoldImages
      };
      
      await adminAPI.createBankLoan(loanData);
      fetchBankLoans();
      resetForm();
      setShowModal(false);
      alert('Bank loan created successfully!');
    } catch (err) {
      console.error('Failed to create bank loan:', err);
      alert('Failed to create loan: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveLoan = async () => {
    if (!loanToApprove) return;
    
    setLoading(true);
    try {
      const data = {
        principalAmount: parseFloat(approvalDetails.principalAmount),
        interestRate: parseFloat(approvalDetails.interestRate)
      };
      
      const response = await adminAPI.approveLoan(loanToApprove.id, data);
      if (response.data.success) {
        fetchPendingLoans();
        fetchCustomerLoans();
        setShowApprovalModal(false);
        setLoanToApprove(null);
        alert('Loan approved successfully');
      }
    } catch (err) {
      console.error('Failed to approve loan:', err);
      alert('Failed to approve loan');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLoan = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      await adminAPI.rejectLoan(loanToApprove.id, { reason: rejectionReason });
      fetchPendingLoans();
      fetchCustomerLoans();
      setShowApprovalModal(false);
      setLoanToApprove(null);
      setRejectionReason('');
      alert('Loan rejected successfully');
    } catch (err) {
      console.error('Failed to reject loan:', err);
      alert('Failed to reject loan');
    }
  };

  const calculateMonthlyBreakdown = (principal, rate, tenure, type = 'COMPOUND') => {
    const monthlyRate = (rate / 12) / 100;
    const monthlyPrincipal = principal / tenure;
    const breakdown = [];
    
    if (type === 'SIMPLE') {
      for (let month = 1; month <= tenure; month++) {
        const monthlyInterest = principal * monthlyRate;
        const totalMonthlyPayment = monthlyPrincipal + monthlyInterest;
        
        breakdown.push({
          month,
          principalPaid: monthlyPrincipal,
          interestPaid: monthlyInterest,
          totalPayment: totalMonthlyPayment,
          remainingBalance: Math.max(0, principal - (monthlyPrincipal * month))
        });
      }
    } else {
      for (let month = 1; month <= tenure; month++) {
        const remainingPrincipal = principal - (monthlyPrincipal * (month - 1));
        const monthlyInterest = remainingPrincipal * monthlyRate;
        const totalMonthlyPayment = monthlyPrincipal + monthlyInterest;
        
        breakdown.push({
          month,
          principalPaid: monthlyPrincipal,
          interestPaid: monthlyInterest,
          totalPayment: totalMonthlyPayment,
          remainingBalance: Math.max(0, remainingPrincipal - monthlyPrincipal)
        });
      }
    }
    
    return breakdown;
  };

  const handleViewInterest = (loan) => {
    const breakdown = calculateMonthlyBreakdown(
      loan.principalAmount,
      loan.interestRate,
      loan.tenureMonths,
      loan.interestType || 'COMPOUND'
    );
    setMonthlyBreakdown(breakdown);
    setSelectedLoan(loan);
    setShowMonthlyBreakdownModal(true);
  };

  const handleRepayment = async () => {
    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (activeTab === 'customer') {
        await adminAPI.processRepayment(selectedLoan.id, parseFloat(repaymentAmount));
        fetchCustomerLoans();
      } else {
        await adminAPI.processBankPayment(selectedLoan.id, parseFloat(repaymentAmount));
        fetchBankLoans();
      }
      setShowRepaymentModal(false);
      setSelectedLoan(null);
      setRepaymentAmount('');
      alert('Repayment processed successfully!');
    } catch (err) {
      console.error('Failed to process repayment:', err);
      alert('Failed to process repayment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleView = (loan) => {
    setSelectedLoan(loan);
    setShowViewModal(true);
  };

  const handleViewCalculations = async (loan) => {
    try {
      const response = await adminAPI.getBankLoanWithDetails(loan.id);
      setSelectedBankLoan(response.data.data);
      setIndividualCalculations(response.data.data.individualGoldCalculations || []);
      setShowCalculationsModal(true);
    } catch (err) {
      console.error('Failed to fetch loan details:', err);
    }
  };

  const handleRepaymentClick = (loan) => {
    setSelectedLoan(loan);
    setShowRepaymentModal(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      principalAmount: '',
      interestRate: '',
      tenureMonths: '',
      goldItemIds: [],
      interestType: 'COMPOUND', 
      customerSerialNumber: '',
      autoGenerateSerialNumber: true,
      bankName: '',
      principalAmountBank: '',
      interestRateBank: '',
      tenureMonthsBank: '',
      goldItemIdsBank: [],
      bankSerialNumber: '',
      bankGoldImages: [],
      customerSerialNumbersBank: ''
    });
    setSelectedGoldItems([]);
    setSelectedGoldItemsDetails([]);
    setImagePreviews([]);
    setCustomerGoldItems([]);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.fullName : 'Unknown';
  };

  const getGoldItemDetails = (itemIds) => {
    if (!itemIds || itemIds.length === 0) return 'No items';
    const items = goldItems.filter(item => itemIds.includes(item.id));
    return items.map(item => `${item.itemType} (${convertWeight(item.weightInGrams)})`).join(', ');
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '#00b894';
      case 'closed': return '#636e72';
      case 'defaulted': return '#ff6b6b';
      case 'pending_approval': return '#f39c12';
      case 'rejected': return '#ff6b6b';
      default: return '#fdcb6e';
    }
  };

  const getStatusText = (status) => {
    return t(`status.${status}`, status || 'Unknown');
  };

  const canApproveLoan = (loanAmount) => {
    const role = localStorage.getItem('userRole');
    
    if (role === 'ADMIN') return true;
    if (role === 'STAFF' && canUserApprove) {
      if (userPermissions.maxLoanApprovalLimit && loanAmount > userPermissions.maxLoanApprovalLimit) {
        return false;
      }
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="loans-container fade-in">
      <div className="loans-header">
        <h1>{t('loans.title')}</h1>
        <div className="header-actions">
          <div className="search-section">
            <div className="search-type-selector">
              <label>
                <input
                  type="radio"
                  value="general"
                  checked={searchType === 'general'}
                  onChange={() => setSearchType('general')}
                />
                {t('common.search')}
              </label>
              <label>
                <input
                  type="radio"
                  value="serial"
                  checked={searchType === 'serial'}
                  onChange={() => setSearchType('serial')}
                />
                {t('loans.customer_serial_number', 'Serial Number')}
              </label>
            </div>
            
            {searchType === 'general' ? (
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search loans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && searchLoans()}
                />
              </div>
            ) : (
              <div className="search-box">
                <FaRegCalendarAlt className="search-icon" />
                <input
                  type="text"
                  placeholder={t('loans.enter_serial_placeholder', 'Enter serial number...')}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && searchLoans()}
                />
              </div>
            )}
            <button className="search-button" onClick={searchLoans}>
              <FaSearch /> {t('common.search')}
            </button>
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> {t('loans.new_loan_btn')}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          <FaUser /> {t('loans.customer')}
        </button>
        
        {(userRole === 'ADMIN' || userRole === 'STAFF') && (
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FaClock /> {t('loans.pending')} ({convertNumber(pendingLoans.length)})
          </button>
        )}
        
        <button 
          className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <FaUniversity /> {t('nav.loans')} (Bank)
        </button>
      </div>

      {activeTab === 'customer' && (
        <div className="loans-grid">
          {customerLoans.length > 0 ? (
            customerLoans.map(loan => {
              const startDateFormatted = formatDateWithNepali(loan.startDate);
              const maturityDateFormatted = formatDateWithNepali(loan.maturityDate);
              
              return (
                <div key={loan.id} className="loan-card">
                  <div className="loan-header">
                    <div>
                      <h3>{displayValue(loan.loanNumber)}</h3>
                      <small>{t('loans.serial', 'Serial')}: {displayValue(loan.customerSerialNumber)}</small>
                    </div>
                    <span className="loan-status" style={{ backgroundColor: getStatusColor(loan.status) }}>
                      {getStatusText(loan.status)}
                    </span>
                  </div>
                  
                  <div className="loan-details">
                    <p><FaUser /> <strong>{t('loans.customer')}:</strong> {getCustomerName(loan.customerId)}</p>
                    <p><FaRupeeSign /> <strong>{t('loans.principal')}:</strong> {convertCurrency(loan.principalAmount)}</p>
                    <p><FaPercentage /> <strong>{t('loans.interest')}:</strong> {convertPercentage(loan.interestRate)} {loan.interestType === 'COMPOUND' ? `(${t('common.compound')})` : `(${t('common.simple')})`}</p>
                    <p><FaCalendarAlt /> <strong>{t('loans.tenure')}:</strong> {convertNumber(loan.tenureMonths)} {t('common.months')}</p>
                    
                    <div className="date-section">
                      <p><strong>{t('loans.start_date', 'Start Date')}:</strong></p>
                      <p className="english-date">{startDateFormatted.english}</p>
                      <p className="nepali-date">{startDateFormatted.nepali}</p>
                    </div>
                    
                    <div className="date-section">
                      <p><strong>{t('loans.maturity_date', 'Maturity Date')}:</strong></p>
                      <p className="english-date">{maturityDateFormatted.english}</p>
                      <p className="nepali-date">{maturityDateFormatted.nepali}</p>
                    </div>
                    
                    <p><strong>{t('loans.outstanding')}:</strong> {convertCurrency(loan.outstandingAmount)}</p>
                    <p><strong>{t('loans.paid', 'Paid')}:</strong> {convertCurrency(loan.amountPaidSoFar)}</p>
                    <p><FaGem /> <strong>{t('nav.gold_items')}:</strong> {getGoldItemDetails(loan.goldItemIds)}</p>
                  </div>

                  <div className="loan-actions">
                    <button className="view-btn" onClick={() => handleView(loan)} title="View Details">
                      <FaEye />
                    </button>
                    <button className="interest-btn" onClick={() => handleViewInterest(loan)} title="Interest Schedule">
                      <FaChartLine />
                    </button>
                    {loan.status === 'ACTIVE' && (
                      <button className="repay-btn" onClick={() => handleRepaymentClick(loan)}>
                        {t('common.pay', 'Repay')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-data">{t('loans.no_data', 'No customer loans found')}</p>
          )}
        </div>
      )}

      {activeTab === 'pending' && (userRole === 'ADMIN' || userRole === 'STAFF') && (
        <div className="loans-grid">
          {loadingPending ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : pendingLoans.length > 0 ? (
            pendingLoans.map(loan => {
              const canApprove = canApproveLoan(loan.principalAmount);
              const requestDateFormatted = formatDateWithNepali(loan.createdAt);
              const customerName = getCustomerName(loan.customerId);
              
              return (
                <div key={loan.id} className="loan-card pending-card">
                  <div className="loan-header">
                    <div>
                      <h3>{displayValue(loan.loanNumber)}</h3>
                      <small>{t('loans.requested', 'Requested')}: {requestDateFormatted.english}</small>
                      <small className="nepali-small">{requestDateFormatted.nepali}</small>
                    </div>
                    <span className="loan-status" style={{ backgroundColor: getStatusColor('PENDING_APPROVAL') }}>
                      {t('status.PENDING_APPROVAL')}
                    </span>
                  </div>
                  
                  <div className="loan-details">
                    <p><FaUser /> <strong>{t('loans.customer')}:</strong> {customerName}</p>
                    <p><FaRupeeSign /> <strong>{t('loans.principal')}:</strong> {convertCurrency(loan.principalAmount)}</p>
                    <p><FaPercentage /> <strong>{t('loans.interest')}:</strong> {convertPercentage(loan.interestRate)} {loan.interestType === 'COMPOUND' ? '(' + t('common.compound') + ')' : '(' + t('common.simple') + ')'}</p>
                    <p><FaCalendarAlt /> <strong>{t('loans.tenure')}:</strong> {convertNumber(loan.tenureMonths)} {t('common.months')}</p>
                    <p><FaGem /> <strong>{t('nav.gold_items')}:</strong> {convertNumber(loan.goldItemIds?.length || 0)} {t('common.items')}</p>
                    
                    <div className="date-section">
                      <p><strong>{t('loans.request_date', 'Request Date')}:</strong></p>
                      <p className="english-date">{requestDateFormatted.english}</p>
                      <p className="nepali-date">{requestDateFormatted.nepali}</p>
                    </div>
                  </div>

                  {canApprove && (
                    <div className="approval-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => {
                          setLoanToApprove(loan);
                          setApprovalAction('approve');
                          setApprovalDetails({
                            principalAmount: loan.principalAmount,
                            interestRate: loan.interestRate || '12'
                          });
                          setShowApprovalModal(true);
                        }}
                      >
                        <FaCheck /> {t('loans.approve')}
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          setLoanToApprove(loan);
                          setApprovalAction('reject');
                          setShowApprovalModal(true);
                        }}
                      >
                        <FaTimes /> {t('loans.reject')}
                      </button>
                    </div>
                  )}
                  
                  {!canApprove && (
                    <div className="approval-message">
                      <p>{t('loans.no_permission', "You don't have permission to approve loans")}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-data-message">
              <p>{t('loans.no_pending', 'No pending loan requests found')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="loans-grid">
          {bankLoans.length > 0 ? (
            bankLoans.map(loan => {
              const startDateFormatted = formatDateWithNepali(loan.startDate);
              const maturityDateFormatted = formatDateWithNepali(loan.maturityDate);
              const totalPayable = loan.principalAmount + loan.totalInterestPayable;
              
              return (
                <div key={loan.id} className="loan-card bank-loan-card">
                  <div className="loan-header">
                    <div>
                      <h3>{displayValue(loan.loanNumber)}</h3>
                      <small>{t('loans.serial', 'Serial')}: {displayValue(loan.bankSerialNumber)}</small>
                    </div>
                    <span className="loan-status" style={{ backgroundColor: getStatusColor(loan.status) }}>
                      {getStatusText(loan.status)}
                    </span>
                  </div>
                  
                  <div className="loan-details">
                    <p><FaUniversity /> <strong>{t('loans.bank', 'Bank')}:</strong> {loan.bankName}</p>
                    <p><FaRupeeSign /> <strong>{t('loans.principal')}:</strong> {convertCurrency(loan.principalAmount)}</p>
                    <p><FaPercentage /> <strong>{t('loans.interest_rate', 'Interest Rate')}:</strong> {convertPercentage(loan.interestRate)}</p>
                    <p><FaCalendarAlt /> <strong>{t('loans.tenure')}:</strong> {convertNumber(loan.tenureMonths)} {t('common.months')}</p>
                    
                    <div className="date-section">
                      <p><strong>{t('loans.start_date', 'Start Date')}:</strong></p>
                      <p className="english-date">{startDateFormatted.english}</p>
                      <p className="nepali-date">{startDateFormatted.nepali}</p>
                    </div>
                    
                    <div className="date-section">
                      <p><strong>{t('loans.maturity_date')}:</strong></p>
                      <p className="english-date">{maturityDateFormatted.english}</p>
                      <p className="nepali-date">{maturityDateFormatted.nepali}</p>
                    </div>
                    
                    <div className="amount-breakdown">
                      <p><strong>{t('loans.principal')}:</strong> {convertCurrency(loan.principalAmount)}</p>
                      <p><strong>{t('loans.total_interest', 'Total Interest')}:</strong> {convertCurrency(loan.totalInterestPayable)}</p>
                      <p className="total-payable">
                        <strong>{t('loans.total_payable', 'Total Payable')}:</strong> {convertCurrency(totalPayable)}
                      </p>
                    </div>
                    
                    <p><strong>{t('loans.outstanding')}:</strong> {convertCurrency(loan.outstandingAmount)}</p>
                    <p><strong>{t('loans.paid')}:</strong> {convertCurrency(loan.amountPaidSoFar)}</p>
                    
                    {loan.pledgedGoldItemIds && loan.pledgedGoldItemIds.length > 0 && (
                      <div className="pledged-items">
                        <p><FaGem /> <strong>{t('loans.pledged_items', 'Pledged Items')}:</strong></p>
                        <ul>
                          {goldItems
                            .filter(item => loan.pledgedGoldItemIds.includes(item.id))
                            .map(item => (
                                <li key={item.id}>
                                  {t(`item_types.${item.itemType}`, item.itemType)} - {convertWeight(item.weightInGrams)} - {displayPurity(item.purity)} 
                                  {item.loanNumber && <span className="loan-number-tag" style={{ marginLeft: '10px', verticalAlign: 'middle' }}>{displayValue(item.loanNumber)}</span>}
                                </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="loan-actions">
                    <button className="view-btn" onClick={() => handleView(loan)}>
                      <FaEye />
                    </button>
                    <button className="monthly-btn" onClick={() => handleViewInterest(loan)}>
                      <FaCalendarCheck /> {t('common.monthly', 'Monthly')}
                    </button>
                    {loan.status === 'ACTIVE' && (
                      <button className="repay-btn" onClick={() => handleRepaymentClick(loan)}>
                        {t('common.pay', 'Pay')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-data">{t('loans.no_bank_loans', 'No bank loans found')}</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content large">
            <h2>{t('loans.create_new', 'Create New Loan')}</h2>
            
            <div className="loan-type-selector">
              <label>
                <input
                  type="radio"
                  name="loanType"
                  value="customer"
                  checked={formData.loanType === 'customer'}
                  onChange={() => setFormData({ ...formData, loanType: 'customer' })}
                />
                {t('loans.customer')}
              </label>
              <label>
                <input
                  type="radio"
                  name="loanType"
                  value="bank"
                  checked={formData.loanType === 'bank'}
                  onChange={() => setFormData({ ...formData, loanType: 'bank' })}
                />
                {t('nav.loans')} (Bank)
              </label>
            </div>

            {formData.loanType === 'customer' && (
              <form onSubmit={handleSubmitCustomerLoan}>
                <div className="form-row">
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t('loans.select_customer', 'Select Customer')}</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} ({customer.email})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="principalAmount"
                    placeholder={`${t('loans.principal')} (NPR)`}
                    value={displayValue(formData.principalAmount)}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <input
                    type="text"
                    name="interestRate"
                    placeholder={`${t('loans.interest')}`}
                    value={displayValue(formData.interestRate)}
                    onChange={handleInputChange}
                    required
                  />

                  <input
                    type="text"
                    name="tenureMonths"
                    placeholder={t('loans.tenure')}
                    value={displayValue(formData.tenureMonths)}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="serial-number-group">
                    <label>
                      <input
                        type="checkbox"
                        name="autoGenerateSerialNumber"
                        checked={formData.autoGenerateSerialNumber}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          autoGenerateSerialNumber: e.target.checked,
                          customerSerialNumber: e.target.checked ? '' : formData.customerSerialNumber
                        })}
                      />
                      {t('loans.auto_generate_serial', 'Auto-generate Serial Number')}
                    </label>
                  </div>
                </div>

                {!formData.autoGenerateSerialNumber && (
                  <div className="form-row">
                    <input
                      type="text"
                      name="customerSerialNumber"
                      placeholder={t('loans.enter_serial', 'Enter Customer Serial Number')}
                      value={displayValue(formData.customerSerialNumber)}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <div className="form-row">
                  <select
                    key={formData.customerId || 'no-customer'} 
                    name="goldItemIds"
                    multiple
                    value={formData.goldItemIds}
                    onChange={handleInputChange}
                    required
                    className="multi-select"
                    size="4"
                  >
                {formData.customerId ? (
                  loadingCustomerGold ? (
                <option disabled>Loading gold items...</option>
                 ) : customerGoldItems.length > 0 ? (
                 customerGoldItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.itemType} - {convertWeight(item.weightInGrams)} - {displayPurity(item.purity)} - {item.serialNumber || 'No Serial'} - {convertCurrency(item.estimatedValue)}
                </option>
                ))
                ) : (
                <option disabled>No available gold items for this customer</option>
                )
                ) : (
                <option disabled>Please select a customer first</option>
                )}
              </select>
              </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="submit-btn">
                    {t('loans.create', 'Create Customer Loan')}
                  </button>
                </div>
              </form>
            )}

            {formData.loanType === 'bank' && (
              <form onSubmit={handleSubmitBankLoan}>
                <div className="form-section">
                  <h3>{t('loans.bank_details', 'Bank Details')}</h3>
                  <div className="form-row">
                    <input
                      type="text"
                      name="bankName"
                      placeholder={t('loans.bank_name', 'Bank Name')}
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                    />

                    <input
                      type="text"
                      name="bankSerialNumber"
                      placeholder={t('loans.bank_serial', 'Bank Serial Number')}
                      value={displayValue(formData.bankSerialNumber)}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('loans.loan_details', 'Loan Details')}</h3>
                  <div className="form-row">
                    <input
                      type="text"
                      name="principalAmountBank"
                      placeholder={t('loans.principal_amount', 'Principal Amount (NPR)')}
                      value={displayValue(formData.principalAmountBank)}
                      onChange={handleInputChange}
                      required
                    />

                    <input
                      type="text"
                      name="interestRateBank"
                      placeholder={t('loans.interest_rate_placeholder', 'Annual Interest Rate (%)')}
                      value={displayValue(formData.interestRateBank)}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      name="tenureMonthsBank"
                      placeholder={t('loans.tenure_placeholder', 'Tenure (months)')}
                      value={displayValue(formData.tenureMonthsBank)}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('loans.customer_serials', 'Customer Serial Numbers')}</h3>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>{t('loans.enter_customer_serials', 'Customer Serial Numbers (Enter manually)')}</label>
                      <input
                        type="text"
                        name="customerSerialNumbersBank"
                        value={displayValue(formData.customerSerialNumbersBank)}
                        onChange={handleInputChange}
                        placeholder={t('loans.customer_serials_placeholder', 'Enter customer serial numbers (comma separated)')}
                        className="manual-input"
                      />
                      <small>{t('loans.customer_serials_helper', 'Enter the customer loan serial numbers associated with these gold items')}</small>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('loans.select_gold_items', 'Select Gold Items')}</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('loans.select_items_label', 'Select Gold Items to Pledge (Multiple)')}</label>
                      {loadingGoldItems ? (
                        <div className="loading-small">{t('common.loading')}</div>
                      ) : availableGoldItems.length > 0 ? (
                        <select
                          name="goldItemIdsBank"
                          multiple
                          value={formData.goldItemIdsBank}
                          onChange={handleGoldItemSelection}
                          className="multi-select"
                          size="6"
                        >
                          {availableGoldItems.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.itemType} - {convertWeight(item.weightInGrams)} - {displayPurity(item.purity)} - 
                              {t('loans.customer')} {item.customerName || 'Unknown'} - 
                              ({t('loans.loan')}: {displayValue(item.loanNumber || 'N/A')}) -
                              {convertCurrency(item.estimatedValue)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="no-items-message">
                          {t('loans.no_items_available', 'No gold items available for bank pledge. Gold items must be in "PLEDGED" status first.')}
                        </div>
                      )}
                      <small>{t('loans.multi_select_helper', 'Hold Ctrl/Cmd to select multiple items')}</small>
                    </div>
                  </div>

                  {selectedGoldItems.length > 0 && (
                    <div className="selected-items-card">
                      <h4>{t('loans.selected_items', 'Selected Gold Items')} ({convertNumber(selectedGoldItems.length)})</h4>
                      <div className="selected-items-grid">
                        {selectedGoldItemsDetails.map((item, index) => (
                          <div key={index} className="selected-item-card">
                            <div className="item-header">
                              <strong>{item.itemType}</strong>
                            </div>
                            <div className="item-details">
                              <p><span>{t('loans.weight')}:</span> {convertWeight(item.weightInGrams)}</p>
                              <p><span>{t('loans.purity')}:</span> {displayPurity(item.purity)}</p>
                              <p><span>{t('loans.value')}:</span> {convertCurrency(item.estimatedValue)}</p>
                              <p><span>{t('loans.customer')}:</span> {item.customerName}</p>
                              {item.loanNumber && <p><span>{t('loans.loan_serial')}:</span> {displayValue(item.loanNumber)}</p>}
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.itemType} className="item-thumbnail" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="selected-items-summary">
                        <p><strong>{t('loans.total_items')}:</strong> {convertNumber(selectedGoldItems.length)}</p>
                        <p><strong>{t('loans.total_value')}:</strong> {convertCurrency(selectedGoldItemsDetails
                          .reduce((sum, item) => sum + (item.estimatedValue || 0), 0))}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>{t('loans.bank_images', 'Bank Gold Images')}</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('loans.upload_images', 'Upload Images (Optional)')}</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBankGoldImageUpload}
                        className="file-input"
                      />
                       <button type="button" onClick={() => setShowWebcam(true)} className="camera-btn" style={{ marginTop: '10px' }}>
                         <FaCamera /> {t('loans.capture_from_webcam', 'Capture from Webcam')}
                       </button>
                      {imagePreviews.length > 0 && (
                        <div className="image-previews">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="preview-container">
                              <img src={preview} alt={`Bank gold ${index + 1}`} className="preview-image" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="submit-btn">
                    {t('loans.create_bank_loan', 'Create Bank Loan')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showApprovalModal && loanToApprove && (
        <div className="modal">
          <div className="modal-content">
            <h2>{approvalAction === 'approve' ? t('loans.approve_loan', 'Approve Loan') : t('loans.reject_loan', 'Reject Loan')}</h2>
            <p><strong>{t('loans.loan')}:</strong> {displayValue(loanToApprove.loanNumber)}</p>
            <p><strong>{t('loans.customer')}:</strong> {getCustomerName(loanToApprove.customerId)}</p>
            <p><strong>{t('loans.amount')}:</strong> {convertCurrency(loanToApprove.principalAmount)}</p>
            
            {approvalAction === 'approve' && (
              <div className="approval-edit-fields" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('loans.principal_amount')}</label>
                  <input
                    type="text"
                    value={displayValue(approvalDetails.principalAmount)}
                    onChange={(e) => setApprovalDetails({ 
                      ...approvalDetails, 
                      principalAmount: toEnglishDigits(e.target.value) 
                    })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('loans.interest_rate')}</label>
                  <input
                    type="text"
                    step="0.1"
                    value={displayValue(approvalDetails.interestRate)}
                    onChange={(e) => setApprovalDetails({ 
                      ...approvalDetails, 
                      interestRate: toEnglishDigits(e.target.value) 
                    })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
            )}

            {approvalAction === 'reject' && (
              <div className="form-row" style={{ marginTop: '20px' }}>
                <textarea
                  placeholder={t('loans.enter_rejection_reason', 'Enter rejection reason')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {
                setShowApprovalModal(false);
                setLoanToApprove(null);
                setRejectionReason('');
              }}>
                {t('common.cancel')}
              </button>
              <button 
                className={approvalAction === 'approve' ? 'approve-btn' : 'reject-btn'}
                onClick={approvalAction === 'approve' ? handleApproveLoan : handleRejectLoan}
              >
                {approvalAction === 'approve' ? t('loans.confirm_approval', 'Confirm Approval') : t('loans.confirm_rejection', 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMonthlyBreakdownModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content large">
            <h2>{t('loans.monthly_schedule', 'Monthly Payment Schedule')} - {displayValue(selectedLoan.loanNumber)}</h2>
            
            <div className="loan-summary">
              <h3>{t('loans.loan_summary', 'Loan Summary')}</h3>
              <p><strong>{t('loans.principal')}:</strong> {convertCurrency(selectedLoan.principalAmount)}</p>
              <p><strong>{t('loans.interest_rate')}:</strong> {convertPercentage(selectedLoan.interestRate)}</p>
              <p><strong>{t('loans.tenure')}:</strong> {convertNumber(selectedLoan.tenureMonths)} {t('common.months')}</p>
              <p><strong>{t('loans.total_interest')}:</strong> {convertCurrency(selectedLoan.totalInterestPayable)}</p>
              <p><strong>{t('loans.total_payable')}:</strong> {convertCurrency(selectedLoan.principalAmount + selectedLoan.totalInterestPayable)}</p>
            </div>

            <div className="monthly-breakdown">
              <h3>{t('loans.monthly_breakdown', 'Monthly Payment Breakdown')}</h3>
              <div className="table-responsive">
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>{t('common.month', 'Month')}</th>
                      <th>{t('loans.principal_recovered', 'Principal Recovered')}</th>
                      <th>{t('loans.interest_earned', 'Interest Earned')}</th>
                      <th>{t('loans.total_collection', 'Total Collection')}</th>
                      <th>{t('loans.remaining_principal', 'Remaining Principal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map((item, index) => (
                      <tr key={index}>
                        <td>{t('common.month', 'Month')} {convertNumber(item.month)}</td>
                        <td>{convertCurrency(item.principalPaid)}</td>
                        <td>{convertCurrency(item.interestPaid)}</td>
                        <td><strong>{convertCurrency(item.totalPayment)}</strong></td>
                        <td>{convertCurrency(item.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowMonthlyBreakdownModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('loans.loan_details', 'Loan Details')} - {displayValue(selectedLoan.loanNumber)}</h2>
            <div className="loan-details-view">
              {activeTab === 'customer' || activeTab === 'pending' ? (
                <>
                  <p><strong>{t('loans.customer_serial')}:</strong> {displayValue(selectedLoan.customerSerialNumber)}</p>
                  <p><strong>{t('loans.customer')}:</strong> {getCustomerName(selectedLoan.customerId)}</p>
                  <p><strong>{t('loans.principal_amount')}:</strong> {convertCurrency(selectedLoan.principalAmount)}</p>
                  <p><strong>{t('loans.interest_rate')}:</strong> {convertPercentage(selectedLoan.interestRate)} {selectedLoan.interestType || '(Simple)'}</p>
                  <p><strong>{t('loans.tenure')}:</strong> {convertNumber(selectedLoan.tenureMonths)} {t('common.months')}</p>
                  
                  <div className="date-section">
                    <p><strong>{t('loans.start_date')}:</strong></p>
                    <p className="english-date">{formatDateWithNepali(selectedLoan.startDate).english}</p>
                    <p className="nepali-date">{formatDateWithNepali(selectedLoan.startDate).nepali}</p>
                  </div>
                  
                  <div className="date-section">
                    <p><strong>{t('loans.maturity_date')}:</strong></p>
                    <p className="english-date">{formatDateWithNepali(selectedLoan.maturityDate).english}</p>
                    <p className="nepali-date">{formatDateWithNepali(selectedLoan.maturityDate).nepali}</p>
                  </div>
                  
                  <p><strong>{t('loans.status')}:</strong> {getStatusText(selectedLoan.status)}</p>
                  {selectedLoan.status === 'REJECTED' && selectedLoan.rejectionReason && (
                    <p><strong>{t('loans.rejection_reason')}:</strong> {selectedLoan.rejectionReason}</p>
                  )}
                  {selectedLoan.status === 'ACTIVE' && (
                    <>
                      <p><strong>{t('loans.total_interest_receivable')}:</strong> {convertCurrency(selectedLoan.totalInterestReceivable)}</p>
                      <p><strong>{t('loans.interest_paid')}:</strong> {convertCurrency(selectedLoan.interestPaidSoFar)}</p>
                      <p><strong>{t('loans.amount_paid')}:</strong> {convertCurrency(selectedLoan.amountPaidSoFar)}</p>
                      <p><strong>{t('loans.outstanding_amount')}:</strong> {convertCurrency(selectedLoan.outstandingAmount)}</p>
                    </>
                  )}
                  <p><strong>{t('nav.gold_items')}:</strong> {getGoldItemDetails(selectedLoan.goldItemIds)}</p>
                </>
              ) : (
                <>
                  <p><strong>{t('loans.bank_serial')}:</strong> {displayValue(selectedLoan.bankSerialNumber)}</p>
                  <p><strong>{t('loans.bank_name')}:</strong> {selectedLoan.bankName}</p>
                  <p><strong>{t('loans.principal_amount')}:</strong> {convertCurrency(selectedLoan.principalAmount)}</p>
                  <p><strong>{t('loans.interest_rate')}:</strong> {convertPercentage(selectedLoan.interestRate)}</p>
                  <p><strong>{t('loans.tenure')}:</strong> {convertNumber(selectedLoan.tenureMonths)} {t('common.months')}</p>
                  
                  <div className="date-section">
                    <p><strong>{t('loans.start_date')}:</strong></p>
                    <p className="english-date">{formatDateWithNepali(selectedLoan.startDate).english}</p>
                    <p className="nepali-date">{formatDateWithNepali(selectedLoan.startDate).nepali}</p>
                  </div>
                  
                  <div className="date-section">
                    <p><strong>{t('loans.maturity_date')}:</strong></p>
                    <p className="english-date">{formatDateWithNepali(selectedLoan.maturityDate).english}</p>
                    <p className="nepali-date">{formatDateWithNepali(selectedLoan.maturityDate).nepali}</p>
                  </div>
                  
                  <p><strong>{t('loans.status')}:</strong> {getStatusText(selectedLoan.status)}</p>
                  <p><strong>{t('loans.total_interest_payable')}:</strong> {convertCurrency(selectedLoan.totalInterestPayable)}</p>
                  <p><strong>{t('loans.interest_paid')}:</strong> {convertCurrency(selectedLoan.interestPaidSoFar)}</p>
                  <p><strong>{t('loans.amount_paid')}:</strong> {convertCurrency(selectedLoan.amountPaidSoFar)}</p>
                  <p><strong>{t('loans.outstanding')}:</strong> {convertCurrency(selectedLoan.outstandingAmount)}</p>
                  {selectedLoan.pledgedGoldItemIds && (
                    <p><strong>{t('loans.pledged_gold_items')}:</strong> {getGoldItemDetails(selectedLoan.pledgedGoldItemIds)}</p>
                  )}
                </>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowViewModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalculationsModal && selectedBankLoan && (
        <div className="modal">
          <div className="modal-content large">
            <h2>{t('loans.bank_loan_details', 'Bank Loan Details')} - {displayValue(selectedBankLoan.loan?.loanNumber || selectedBankLoan.loanNumber)}</h2>
            
            <div className="loan-summary">
              <h3>{t('loans.loan_summary')}</h3>
              <p><strong>{t('loans.bank')}:</strong> {selectedBankLoan.loan?.bankName || selectedBankLoan.bankName}</p>
              <p><strong>{t('loans.serial_number')}:</strong> {displayValue(selectedBankLoan.loan?.bankSerialNumber || selectedBankLoan.bankSerialNumber)}</p>
              <p><strong>{t('loans.total_principal')}:</strong> {convertCurrency(selectedBankLoan.loan?.principalAmount || selectedBankLoan.principalAmount)}</p>
              <p><strong>{t('loans.interest_rate')}:</strong> {convertPercentage(selectedBankLoan.loan?.interestRate || selectedBankLoan.interestRate)}</p>
              <p><strong>{t('loans.tenure')}:</strong> {convertNumber(selectedBankLoan.loan?.tenureMonths || selectedBankLoan.tenureMonths)} {t('common.months')}</p>
              <p><strong>{t('loans.total_interest')}:</strong> {convertCurrency(selectedBankLoan.loan?.totalInterestPayable || selectedBankLoan.totalInterestPayable)}</p>
            </div>

            <div className="individual-items">
              <h3>{t('loans.individual_breakdown', 'Individual Gold Item Breakdown')}</h3>
              <div className="table-responsive">
                <table className="calculations-table">
                  <thead>
                    <tr>
                      <th>{t('loans.item_type')}</th>
                      <th>{t('loans.customer_loan_serial')}</th>
                      <th>{t('loans.weight')}</th>
                      <th>{t('loans.value')}</th>
                      <th>{t('loans.allocated_principal')}</th>
                      <th>{t('loans.allocated_interest')}</th>
                      <th>{t('loans.proportion')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualCalculations.map((calc, index) => (
                      <tr key={index}>
                        <td>{calc.itemType}</td>
                        <td><span className="loan-number-tag">{displayValue(calc.loanNumber || 'N/A')}</span></td>
                        <td>{convertWeight(calc.weightInGrams)}</td>
                        <td>{convertCurrency(calc.estimatedValue)}</td>
                        <td>{convertCurrency(calc.allocatedPrincipal)}</td>
                        <td>{convertCurrency(calc.allocatedInterest)}</td>
                        <td>{convertNumber((calc.proportion * 100).toFixed(2))}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedBankLoan.loan?.bankGoldImages && selectedBankLoan.loan.bankGoldImages.length > 0 && (
              <div className="bank-images">
                <h3>{t('loans.bank_gold_images')}</h3>
                <div className="image-gallery">
                  {selectedBankLoan.loan.bankGoldImages.map((image, index) => (
                    <div key={index} className="gallery-image">
                      <img src={image} alt={`Bank gold ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCalculationsModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepaymentModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('loans.process_repayment', 'Process Repayment')}</h2>
            <p><strong>{t('loans.loan')}:</strong> {displayValue(selectedLoan.loanNumber)}</p>
            <p><strong>{t('loans.serial')}:</strong> {activeTab === 'customer' ? displayValue(selectedLoan.customerSerialNumber) : displayValue(selectedLoan.bankSerialNumber)}</p>
            <p><strong>{t('loans.outstanding_amount')}:</strong> {convertCurrency(selectedLoan.outstandingAmount)}</p>
            
            <div className="form-row">
              <input
                type="text"
                placeholder={t('loans.enter_repayment_amount', 'Enter repayment amount')}
                value={displayValue(repaymentAmount)}
                onChange={(e) => setRepaymentAmount(toEnglishDigits(e.target.value))}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => {
                setShowRepaymentModal(false);
                setSelectedLoan(null);
                setRepaymentAmount('');
              }}>
                {t('common.cancel')}
              </button>
              <button type="button" className="submit-btn" onClick={handleRepayment}>
                {t('loans.process_payment', 'Process Payment')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCaptureForBank}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
};

export default Loans;