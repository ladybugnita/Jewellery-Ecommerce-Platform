import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { adminAPI } from '../services/api';
import { FaMoneyBillWave, FaUsers, FaGem, FaChartLine, FaCoins, FaPercentage } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useNepaliNumber } from '../hooks/useNepaliNumber';
import { formatDate } from '../utils/nepaliFormat';

const ConversionTest = () => {
  const { i18n } = useTranslation();
  const { convertNumber, convertCurrency, convertNumberWithCommas } = useNepaliNumber();
};

const Dashboard = ({ token }) => {
  const { t, i18n } = useTranslation();
  const { convertCurrency, convertNumberWithCommas, convertWeight, convertPercentage, convertNumber } = useNepaliNumber();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentLoans, setRecentLoans] = useState([]);
  const [loanStats, setLoanStats] = useState({
    active: 0,
    closed: 0,
    defaulted: 0
  });

  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language changed, forcing re-render');
      setRenderKey(prev => prev + 1);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentLoans();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setMetrics(response.data.data);
      
      if (response.data.data) {
        setLoanStats({
          active: response.data.data.activeCustomerLoans || 0,
          closed: response.data.data.closedLoans || 0,
          defaulted: response.data.data.defaultedLoans || 0
        });
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLoans = async () => {
    try {
      const response = await adminAPI.getCustomerLoans();
      const loansData = Array.isArray(response.data.data) ? response.data.data : [];
      setRecentLoans(loansData.slice(-5));
    } catch (err) {
      console.error('Failed to fetch recent loans:', err);
      setRecentLoans([]); 
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      await adminAPI.saveSnapshot();
      alert('Dashboard snapshot saved successfully!');
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const loanStatusData = [
    { name: t('status.ACTIVE'), value: Number(loanStats.active) || 0 },
    { name: t('status.CLOSED'), value: Number(loanStats.closed) || 0 },
    { name: t('status.DEFAULTED', 'Defaulted'), value: Number(loanStats.defaulted) || 0 }
  ].filter(item => item.value > 0);

  if (loanStatusData.length === 0) {
    loanStatusData.push({ name: 'No Loans', value: 1 });
  }

  const COLORS = ['#667eea', '#00b894', '#ff6b6b', '#fdcb6e'];

  const monthlyData = Array.isArray(metrics?.monthlyLoanTrend) 
    ? metrics.monthlyLoanTrend 
    : [
        { name: 'Jan', amount: 0 },
        { name: 'Feb', amount: 0 },
        { name: 'Mar', amount: 0 },
        { name: 'Apr', amount: 0 },
        { name: 'May', amount: 0 },
        { name: 'Jun', amount: 0 }
      ];

  return (
    <div className="dashboard fade-in" key={renderKey}>
      <ConversionTest />
      
      <div className="dashboard-header">
        <h1 className="dashboard-title">{t('nav.dashboard')} {t('dashboard.overview', 'Overview')}</h1>
        <button className="snapshot-button" onClick={handleSaveSnapshot}>
          {t('dashboard.save_snapshot', 'Save Snapshot')}
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FaMoneyBillWave />
          </div>
          <div className="metric-info">
            <h3>{t('dashboard.total_investment', 'Total Investment')}</h3>
            <p className="metric-value">{convertCurrency(metrics?.totalInvestment)}</p>
            <span className="metric-change positive">+{convertNumberWithCommas(12.5)}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <FaPercentage />
          </div>
          <div className="metric-info">
            <h3>{t('dashboard.receivable_interest', 'Receivable Interest')}</h3>
            <p className="metric-value">{convertCurrency(metrics?.totalReceivableInterest)}</p>
            <span className="metric-change positive">+{convertNumberWithCommas(8.2)}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <FaCoins />
          </div>
          <div className="metric-info">
            <h3>{t('dashboard.payable_interest', 'Payable Interest')}</h3>
            <p className="metric-value">{convertCurrency(metrics?.totalPayableInterest)}</p>
            <span className="metric-change negative">-{convertNumberWithCommas(2.1)}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <FaUsers />
          </div>
          <div className="metric-info">
            <h3>{t('dashboard.total_customers')}</h3>
            <p className="metric-value">{convertNumberWithCommas(metrics?.totalCustomers || 0)}</p>
            <span className="metric-change positive">+{convertNumberWithCommas(metrics?.totalCustomers || 0)}</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h2>{t('dashboard.loan_distribution', 'Loan Distribution')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${convertNumberWithCommas((percent * 100).toFixed(0))}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
              >
                {loanStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => convertNumberWithCommas(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>{t('dashboard.loan_trend', 'Monthly Loan Trend')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => convertCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-cards">
          <div className="summary-card">
            <h3>{t('dashboard.net_profit', 'Net Profit')}</h3>
            <p className="profit-value">{convertCurrency(metrics?.netProfit)}</p>
            <p className="profit-detail">{t('dashboard.receivable_interest')}: {convertCurrency(metrics?.totalReceivableInterest)}</p>
            <p className="profit-detail">{t('dashboard.payable_interest')}: {convertCurrency(metrics?.totalPayableInterest)}</p>
          </div>

          <div className="summary-card">
            <h3>{t('nav.loans')} (Bank)</h3>
            <p className="profit-value">{convertCurrency(metrics?.totalBankLoans)}</p>
            <p className="profit-detail">{t('dashboard.active_loans')}: {convertNumberWithCommas(metrics?.activeBankLoans || 0)}</p>
            <p className="profit-detail">{t('dashboard.gold_pledged', 'Gold Pledged')}: {convertWeight(metrics?.totalGoldWeightPledged)}</p>
          </div>
        </div>

        <div className="recent-loans-card">
          <h3>{t('dashboard.recent_loans')}</h3>
          <div className="recent-loans-list">
            {recentLoans.length > 0 ? (
              recentLoans.map(loan => (
                <div key={loan.id} className="recent-loan-item">
                  <span className="loan-amount">{convertCurrency(loan.principalAmount)}</span>
                  <span className="loan-status" data-status={loan.status?.toLowerCase()}>
                    {t(`status.${loan.status}`, loan.status)}
                  </span>
                  <span className="loan-date">{formatDate(loan.createdAt, i18n.language)}</span>
                </div>
              ))
            ) : (
              <p className="no-data">{t('dashboard.no_recent_loans')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;