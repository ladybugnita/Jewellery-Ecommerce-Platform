import React, { useState, useEffect } from 'react';
import './Loans.css';
import { adminAPI } from '../services/api';
import { 
  FaMoneyBillWave, 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaUniversity,
  FaUser,
  FaCalendarAlt,
  FaPercentage,
  FaRupeeSign,
  FaGem
} from 'react-icons/fa';

const Loans = ({ token }) => {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'bank'
  const [customerLoans, setCustomerLoans] = useState([]);
  const [bankLoans, setBankLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [goldItems, setGoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    principalAmount: '',
    interestRate: '',
    tenureMonths: '',
    goldItemIds: [],
    
    bankName: '',
    principalAmountBank: '',
    interestRateBank: '',
    tenureMonthsBank: '',
    goldItemIdsBank: []
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
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
  };

  const fetchCustomerLoans = async () => {
    try {
      const response = await adminAPI.getCustomerLoans();
      setCustomerLoans(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch customer loans:', err);
      setCustomerLoans([]);
    }
  };

  const fetchBankLoans = async () => {
    try {
      const response = await adminAPI.getBankLoans();
      setBankLoans(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch bank loans:', err);
      setBankLoans([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const fetchGoldItems = async () => {
    try {
      const response = await adminAPI.getGoldItems();
      setGoldItems(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Failed to fetch gold items:', err);
      setGoldItems([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, option => option.value);
      setFormData({ ...formData, [name]: values });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmitCustomerLoan = async (e) => {
    e.preventDefault();
    try {
      const loanData = {
        customerId: formData.customerId,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: parseInt(formData.tenureMonths),
        goldItemIds: formData.goldItemIds
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
        goldItemIds: formData.goldItemIdsBank
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
      bankName: '',
      principalAmountBank: '',
      interestRateBank: '',
      tenureMonthsBank: '',
      goldItemIdsBank: []
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.fullName : 'Unknown';
  };

  const getGoldItemDetails = (itemIds) => {
    if (!itemIds || itemIds.length === 0) return 'No items';
    const items = goldItems.filter(item => itemIds.includes(item.id));
    return items.map(item => `${item.itemType} (${item.weightInGrams}g)`).join(', ');
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '#00b894';
      case 'closed': return '#636e72';
      case 'defaulted': return '#ff6b6b';
      default: return '#fdcb6e';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const calculateInterest = (principal, rate, tenure) => {
    return (principal * rate / 100 * tenure).toFixed(2);
  };

  const filteredCustomerLoans = customerLoans.filter(loan =>
    getCustomerName(loan.customerId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBankLoans = bankLoans.filter(loan =>
    loan.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1>Loans Management</h1>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <FaPlus /> New Loan
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          <FaUser /> Customer Loans
        </button>
        <button 
          className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <FaUniversity /> Bank Loans
        </button>
      </div>

      {activeTab === 'customer' && (
        <div className="loans-grid">
          {filteredCustomerLoans.length > 0 ? (
            filteredCustomerLoans.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-header">
                  <h3>{loan.loanNumber}</h3>
                  <span className="loan-status" style={{ backgroundColor: getStatusColor(loan.status) }}>
                    {loan.status}
                  </span>
                </div>
                
                <div className="loan-details">
                  <p><FaUser /> <strong>Customer:</strong> {getCustomerName(loan.customerId)}</p>
                  <p><FaRupeeSign /> <strong>Principal:</strong> {formatCurrency(loan.principalAmount)}</p>
                  <p><FaPercentage /> <strong>Interest Rate:</strong> {loan.interestRate}% monthly</p>
                  <p><FaCalendarAlt /> <strong>Tenure:</strong> {loan.tenureMonths} months</p>
                  <p><strong>Maturity:</strong> {new Date(loan.maturityDate).toLocaleDateString()}</p>
                  <p><strong>Outstanding:</strong> {formatCurrency(loan.outstandingAmount)}</p>
                  <p><strong>Paid:</strong> {formatCurrency(loan.amountPaidSoFar)}</p>
                  <p><FaGem /> <strong>Gold Items:</strong> {getGoldItemDetails(loan.goldItemIds)}</p>
                </div>

                <div className="loan-actions">
                  <button className="view-btn" onClick={() => handleView(loan)}>
                    <FaEye />
                  </button>
                  {loan.status === 'ACTIVE' && (
                    <button className="repay-btn" onClick={() => handleRepaymentClick(loan)}>
                      Repay
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No customer loans found</p>
          )}
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="loans-grid">
          {filteredBankLoans.length > 0 ? (
            filteredBankLoans.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-header">
                  <h3>{loan.loanNumber}</h3>
                  <span className="loan-status" style={{ backgroundColor: getStatusColor(loan.status) }}>
                    {loan.status}
                  </span>
                </div>
                
                <div className="loan-details">
                  <p><FaUniversity /> <strong>Bank:</strong> {loan.bankName}</p>
                  <p><FaRupeeSign /> <strong>Principal:</strong> {formatCurrency(loan.principalAmount)}</p>
                  <p><FaPercentage /> <strong>Interest Rate:</strong> {loan.interestRate}% monthly</p>
                  <p><FaCalendarAlt /> <strong>Tenure:</strong> {loan.tenureMonths} months</p>
                  <p><strong>Maturity:</strong> {new Date(loan.maturityDate).toLocaleDateString()}</p>
                  <p><strong>Outstanding:</strong> {formatCurrency(loan.outstandingAmount)}</p>
                  <p><strong>Paid:</strong> {formatCurrency(loan.amountPaidSoFar)}</p>
                  {loan.pledgedGoldItemIds && (
                    <p><FaGem /> <strong>Pledged Items:</strong> {getGoldItemDetails(loan.pledgedGoldItemIds)}</p>
                  )}
                </div>

                <div className="loan-actions">
                  <button className="view-btn" onClick={() => handleView(loan)}>
                    <FaEye />
                  </button>
                  {loan.status === 'ACTIVE' && (
                    <button className="repay-btn" onClick={() => handleRepaymentClick(loan)}>
                      Pay
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No bank loans found</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content large">
            <h2>Create New Loan</h2>
            
            <div className="loan-type-selector">
              <label>
                <input
                  type="radio"
                  name="loanType"
                  value="customer"
                  checked={formData.loanType === 'customer'}
                  onChange={() => setFormData({ ...formData, loanType: 'customer' })}
                />
                Customer Loan
              </label>
              <label>
                <input
                  type="radio"
                  name="loanType"
                  value="bank"
                  checked={formData.loanType === 'bank'}
                  onChange={() => setFormData({ ...formData, loanType: 'bank' })}
                />
                Bank Loan
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
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} ({customer.email})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    name="principalAmount"
                    placeholder="Principal Amount (NPR)"
                    value={formData.principalAmount}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>

                <div className="form-row">
                  <input
                    type="number"
                    name="interestRate"
                    placeholder="Interest Rate (% monthly)"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    min="0.1"
                    max="5"
                  />

                  <input
                    type="number"
                    name="tenureMonths"
                    placeholder="Tenure (months)"
                    value={formData.tenureMonths}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="36"
                  />
                </div>

                <div className="form-row">
                  <select
                    name="goldItemIds"
                    multiple
                    value={formData.goldItemIds}
                    onChange={handleInputChange}
                    required
                    className="multi-select"
                    size="4"
                  >
                    {goldItems
                      .filter(item => item.status === 'AVAILABLE')
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.itemType} - {item.weightInGrams}g - {item.purity} - NPR {item.estimatedValue}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Create Customer Loan
                  </button>
                </div>
              </form>
            )}

            {formData.loanType === 'bank' && (
              <form onSubmit={handleSubmitBankLoan}>
                <div className="form-row">
                  <input
                    type="text"
                    name="bankName"
                    placeholder="Bank Name"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />

                  <input
                    type="number"
                    name="principalAmountBank"
                    placeholder="Principal Amount (NPR)"
                    value={formData.principalAmountBank}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>

                <div className="form-row">
                  <input
                    type="number"
                    name="interestRateBank"
                    placeholder="Interest Rate (% monthly)"
                    value={formData.interestRateBank}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    min="0.1"
                    max="3"
                  />

                  <input
                    type="number"
                    name="tenureMonthsBank"
                    placeholder="Tenure (months)"
                    value={formData.tenureMonthsBank}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="60"
                  />
                </div>

                <div className="form-row">
                  <select
                    name="goldItemIdsBank"
                    multiple
                    value={formData.goldItemIdsBank}
                    onChange={handleInputChange}
                    className="multi-select"
                    size="4"
                  >
                    {goldItems
                      .filter(item => item.status === 'PLEDGED')
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.itemType} - {item.weightInGrams}g - Customer: {getCustomerName(item.customerId)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Create Bank Loan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showViewModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>Loan Details - {selectedLoan.loanNumber}</h2>
            <div className="loan-details-view">
              {activeTab === 'customer' ? (
                <>
                  <p><strong>Customer:</strong> {getCustomerName(selectedLoan.customerId)}</p>
                  <p><strong>Principal Amount:</strong> {formatCurrency(selectedLoan.principalAmount)}</p>
                  <p><strong>Interest Rate:</strong> {selectedLoan.interestRate}% monthly</p>
                  <p><strong>Tenure:</strong> {selectedLoan.tenureMonths} months</p>
                  <p><strong>Start Date:</strong> {new Date(selectedLoan.startDate).toLocaleString()}</p>
                  <p><strong>Maturity Date:</strong> {new Date(selectedLoan.maturityDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {selectedLoan.status}</p>
                  <p><strong>Total Interest Receivable:</strong> {formatCurrency(selectedLoan.totalInterestReceivable)}</p>
                  <p><strong>Interest Paid:</strong> {formatCurrency(selectedLoan.interestPaidSoFar)}</p>
                  <p><strong>Amount Paid:</strong> {formatCurrency(selectedLoan.amountPaidSoFar)}</p>
                  <p><strong>Outstanding Amount:</strong> {formatCurrency(selectedLoan.outstandingAmount)}</p>
                  <p><strong>Gold Items:</strong> {getGoldItemDetails(selectedLoan.goldItemIds)}</p>
                </>
              ) : (
                <>
                  <p><strong>Bank Name:</strong> {selectedLoan.bankName}</p>
                  <p><strong>Principal Amount:</strong> {formatCurrency(selectedLoan.principalAmount)}</p>
                  <p><strong>Interest Rate:</strong> {selectedLoan.interestRate}% monthly</p>
                  <p><strong>Tenure:</strong> {selectedLoan.tenureMonths} months</p>
                  <p><strong>Start Date:</strong> {new Date(selectedLoan.startDate).toLocaleString()}</p>
                  <p><strong>Maturity Date:</strong> {new Date(selectedLoan.maturityDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {selectedLoan.status}</p>
                  <p><strong>Total Interest Payable:</strong> {formatCurrency(selectedLoan.totalInterestPayable)}</p>
                  <p><strong>Interest Paid:</strong> {formatCurrency(selectedLoan.interestPaidSoFar)}</p>
                  <p><strong>Amount Paid:</strong> {formatCurrency(selectedLoan.amountPaidSoFar)}</p>
                  <p><strong>Outstanding Amount:</strong> {formatCurrency(selectedLoan.outstandingAmount)}</p>
                  {selectedLoan.pledgedGoldItemIds && (
                    <p><strong>Pledged Gold Items:</strong> {getGoldItemDetails(selectedLoan.pledgedGoldItemIds)}</p>
                  )}
                </>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepaymentModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>Process Repayment</h2>
            <p>Loan: {selectedLoan.loanNumber}</p>
            <p>Outstanding Amount: {formatCurrency(selectedLoan.outstandingAmount)}</p>
            
            <div className="form-row">
              <input
                type="number"
                placeholder="Enter repayment amount"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                min="1"
                max={selectedLoan.outstandingAmount}
                step="100"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => {
                setShowRepaymentModal(false);
                setSelectedLoan(null);
                setRepaymentAmount('');
              }}>
                Cancel
              </button>
              <button type="button" className="submit-btn" onClick={handleRepayment}>
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;