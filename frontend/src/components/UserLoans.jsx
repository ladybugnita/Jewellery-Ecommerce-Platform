import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import { FaMoneyBillWave, FaEye, FaCalendarAlt, FaPercentage, FaRupeeSign, FaPlus, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './UserLoans.css';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { 
  formatCurrency, 
  formatNumberNepali, 
  formatDate, 
  formatDateTime, 
  formatPercent, 
  toNepaliDigits,
  toEnglishDigits 
} from '../utils/nepaliFormat';

const UserLoans = () => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const { convertNumber, convertCurrency: convertCurrencyHook, convertPercentage } = useNepaliNumber();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [payoffDate, setPayoffDate] = useState(new Date().toISOString().slice(0, 10));
  const [showMonthlyBreakdownModal, setShowMonthlyBreakdownModal] = useState(false);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  
  const navigate = useNavigate();

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return currentLng === 'ne' ? toNepaliDigits(value.toString()) : value.toString();
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      console.log('Fetching user loans...');
      const response = await userAPI.getMyLoans();
      console.log('Loans response:', response.data);
      setLoans(response.data.data || []);
    } catch (err) {
      console.error('Failed to load loans:', err);
      setError('Failed to load loans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
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
    return t(`user.loans.status.${status}`, status || 'Unknown');
  };

  const calculatePayoff = () => {
    if (!selectedLoan || selectedLoan.status !== 'ACTIVE') return null;
    
    const start = new Date(selectedLoan.startDate);
    const end = new Date(payoffDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (end < start) return { days: 0, interest: 0, total: selectedLoan.principalAmount };
    
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    const dailyInterestRate = (selectedLoan.interestRate / 365) / 100;
    const totalInterest = selectedLoan.principalAmount * dailyInterestRate * days;
    
    const totalDaysInTenure = selectedLoan.tenureMonths * 30; 
    let proratedPrincipal = (selectedLoan.principalAmount / totalDaysInTenure) * days;
    
    if (proratedPrincipal > selectedLoan.principalAmount) {
        proratedPrincipal = selectedLoan.principalAmount;
    }
    
    return {
      days,
      interest: totalInterest,
      proratedPrincipal: proratedPrincipal,
      total: proratedPrincipal + totalInterest
    };
  };

  const calculateMonthlyBreakdown = (principal, rate, tenure) => {
    const monthlyRate = (rate / 12) / 100;
    const monthlyPrincipal = principal / tenure;
    const breakdown = [];
    
    for (let month = 1; month <= tenure; month++) {
      const remainingPrincipal = principal - (monthlyPrincipal * (month - 1));
      const monthlyInterest = remainingPrincipal * monthlyRate;
      const totalMonthlyPayment = monthlyPrincipal + monthlyInterest;
      
      breakdown.push({
        month,
        principalPaid: monthlyPrincipal,
        interestPaid: monthlyInterest,
        totalPayment: totalMonthlyPayment,
        remainingBalance: remainingPrincipal - monthlyPrincipal > 0 ? remainingPrincipal - monthlyPrincipal : 0
      });
    }
    
    return breakdown;
  };

  const handleViewMonthlyBreakdown = (loan) => {
    const breakdown = calculateMonthlyBreakdown(
      loan.principalAmount,
      loan.interestRate,
      loan.tenureMonths
    );
    setMonthlyBreakdown(breakdown);
    setSelectedLoan(loan);
    setShowMonthlyBreakdownModal(true);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="user-loans fade-in">
      {error && <div className="error-message">{error}</div>}
      
      <div className="loans-header">
        <h1>{t('user.loans.title')}</h1>
        <button className="request-loan-btn" onClick={() => navigate('/user/request-loan')}>
          <FaPlus /> {t('user.loans.request_new')}
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="empty-state">
          <p>{t('user.loans.empty')}</p>
        </div>
      ) : (
        <div className="loans-list">
          {loans.map(loan => (
            <div key={loan.id} className="loan-card">
              <div className="loan-header">
                <h3>{displayValue(loan.loanNumber)}</h3>
                <span className="loan-status" style={{ backgroundColor: getStatusColor(loan.status) }}>
                  {getStatusText(loan.status)}
                </span>
              </div>

              <div className="loan-details">
                <p><FaRupeeSign /> <strong>{t('user.loans.fields.principal')}:</strong> {convertCurrencyHook(loan.principalAmount)}</p>
                <p><FaPercentage /> <strong>{t('user.loans.fields.interest_rate')}:</strong> {convertPercentage(loan.interestRate)}</p>
                <p><FaCalendarAlt /> <strong>{t('user.loans.fields.tenure')}:</strong> {convertNumber(loan.tenureMonths)} {t('common.months')}</p>
                <p><FaCalendarAlt /> <strong>{t('user.loans.fields.start_date')}:</strong> {formatDate(loan.startDate, currentLng)}</p>
                <p><FaCalendarAlt /> <strong>{t('user.loans.fields.maturity_date')}:</strong> {formatDate(loan.maturityDate, currentLng)}</p>
                {loan.status === 'ACTIVE' && (
                  <>
                    <p><strong>{t('user.loans.fields.outstanding')}:</strong> {convertCurrencyHook(loan.outstandingAmount)}</p>
                    <p><strong>{t('user.loans.fields.paid')}:</strong> {convertCurrencyHook(loan.amountPaidSoFar)}</p>
                  </>
                )}
                {loan.status === 'REJECTED' && loan.rejectionReason && (
                  <p><strong>{t('user.loans.fields.rejection_reason')}:</strong> {loan.rejectionReason}</p>
                )}
              </div>

              <div className="loan-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button className="view-details-btn" onClick={() => handleViewDetails(loan)} style={{ flex: 1 }}>
                  <FaEye /> {t('user.loans.actions.view_details')}
                </button>
                <button className="view-details-btn" onClick={() => handleViewMonthlyBreakdown(loan)} style={{ flex: 1, backgroundColor: '#3498db', color: 'white' }}>
                  <FaCalendarCheck /> {t('user.loans.actions.breakdown')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('user.loans.actions.view_details')} - {displayValue(selectedLoan.loanNumber)}</h2>
            <div className="loan-details-view">
              <p><strong>{t('user.loans.fields.loan_number')}:</strong> {displayValue(selectedLoan.loanNumber)}</p>
              <p><strong>{t('user.loans.fields.serial_number')}:</strong> {displayValue(selectedLoan.customerSerialNumber)}</p>
              <p><strong>{t('user.loans.fields.principal')}:</strong> {convertCurrencyHook(selectedLoan.principalAmount)}</p>
              <p><strong>{t('user.loans.fields.interest_rate')}:</strong> {convertPercentage(selectedLoan.interestRate)}</p>
              <p><strong>{t('user.loans.fields.tenure')}:</strong> {convertNumber(selectedLoan.tenureMonths)} {t('common.months')}</p>
              <p><strong>{t('user.loans.fields.start_date')}:</strong> {formatDateTime(selectedLoan.startDate, currentLng)}</p>
              <p><strong>{t('user.loans.fields.maturity_date')}:</strong> {formatDate(selectedLoan.maturityDate, currentLng)}</p>
              <p><strong>{t('loans.status')}:</strong> {getStatusText(selectedLoan.status)}</p>
              {selectedLoan.status === 'REJECTED' && selectedLoan.rejectionReason && (
                <p><strong>{t('user.loans.fields.rejection_reason')}:</strong> {selectedLoan.rejectionReason}</p>
              )}
              {selectedLoan.status === 'ACTIVE' && (
                <>
                  <div className="payoff-calculator" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '1.1rem', color: '#2c3e50' }}>{t('user.loans.payoff_calculator.title')}</h3>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('user.loans.payoff_calculator.calculate_till')}</label>
                      <input 
                        type="date" 
                        value={payoffDate} 
                        onChange={(e) => setPayoffDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                      />
                    </div>
                    {calculatePayoff() && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                        <div><strong>{t('user.loans.payoff_calculator.days_passed')}:</strong> {convertNumber(calculatePayoff().days)}</div>
                        <div><strong>{t('user.loans.payoff_calculator.prorated_principal')}:</strong> {convertCurrencyHook(calculatePayoff().proratedPrincipal)}</div>
                        <div><strong>{t('user.loans.payoff_calculator.interest_till_date')}:</strong> {convertCurrencyHook(calculatePayoff().interest)}</div>
                        <div style={{ color: '#e74c3c', fontSize: '1.1rem' }}><strong>{t('user.loans.payoff_calculator.total_to_pay')}:</strong> {convertCurrencyHook(calculatePayoff().total)}</div>
                      </div>
                    )}
                  </div>
                  
                  <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{t('loans.current_status')}</h3>
                  <p><strong>{t('loans.total_interest')}:</strong> {convertCurrencyHook(selectedLoan.totalInterestReceivable)}</p>
                  <p><strong>{t('loans.interest_paid', 'Interest Paid')}:</strong> {convertCurrencyHook(selectedLoan.interestPaidSoFar)}</p>
                  <p><strong>{t('loans.amount_paid', 'Amount Paid')}:</strong> {convertCurrencyHook(selectedLoan.amountPaidSoFar)}</p>
                  <p><strong>{t('loans.outstanding')}:</strong> {convertCurrencyHook(selectedLoan.outstandingAmount)}</p>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDetailsModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showMonthlyBreakdownModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content large" style={{ maxWidth: '800px', width: '90%' }}>
            <h2 style={{ marginBottom: '15px' }}>{t('user.loans.monthly_breakdown.title')} - {displayValue(selectedLoan.loanNumber)}</h2>
            
            <div className="loan-summary" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('user.loans.monthly_breakdown.summary')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <p style={{ margin: '5px 0' }}><strong>{t('loans.principal')}:</strong> {convertCurrencyHook(selectedLoan.principalAmount)}</p>
                <p style={{ margin: '5px 0' }}><strong>{t('loans.interest_rate')}:</strong> {convertPercentage(selectedLoan.interestRate)}</p>
                <p style={{ margin: '5px 0' }}><strong>{t('loans.tenure')}:</strong> {convertNumber(selectedLoan.tenureMonths)} {t('common.months')}</p>
              </div>
            </div>

            <div className="monthly-breakdown">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{t('loans.monthly_breakdown')}</h3>
              <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table className="breakdown-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f2f6' }}>
                    <tr>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>{t('user.loans.monthly_breakdown.table.month')}</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>{t('user.loans.monthly_breakdown.table.principal_paid')}</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>{t('user.loans.monthly_breakdown.table.interest_paid')}</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>{t('user.loans.monthly_breakdown.table.total_payment')}</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>{t('user.loans.monthly_breakdown.table.remaining_balance')}</th>
                     </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px' }}>{t('common.month')} {convertNumber(item.month)}</td>
                        <td style={{ padding: '12px' }}>{convertCurrencyHook(item.principalPaid)}</td>
                        <td style={{ padding: '12px' }}>{convertCurrencyHook(item.interestPaid)}</td>
                        <td style={{ padding: '12px' }}><strong>{convertCurrencyHook(item.totalPayment)}</strong></td>
                        <td style={{ padding: '12px' }}>{convertCurrencyHook(item.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => setShowMonthlyBreakdownModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoans;