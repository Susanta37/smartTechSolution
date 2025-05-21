  import { useEffect, useState } from 'react';
  import { useSelector } from 'react-redux';
  import { useTranslation } from 'react-i18next';
  import api from '../redux/api';
  import ProtectedRoute from '../components/ProtectedRoute';

  const EmployeeDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [data, setData] = useState({
      services: [],
      transactions: [],
      commissions: { total: 0, commissions: [] },
    });
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
      if (user?.role === 'employee') {
        Promise.all([
          api.get('/api/services'), // Employee-accessible services
          api.get('/api/transactions'), // Employee-accessible transactions
          api.get(`/api/commissions/monthly/${new Date().toISOString().slice(0, 7)}`), // Monthly commissions
        ])
          .then(([servicesRes, transactionsRes, commissionsRes]) => {
            setData({
              services: servicesRes.data.slice(0, 5), // Limit to 5 recent
              transactions: transactionsRes.data.slice(0, 5),
              commissions: commissionsRes.data,
            });
          })
          .catch((err) => {
            setError(err.response?.data?.message || 'Failed to load data');
          });
      }
    }, [user]);

    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
    if (!data.services.length && !data.transactions.length && !data.commissions.total)
      return <div className="text-center mt-10">{t('loading')}...</div>;

    return (
      <ProtectedRoute roles={['employee']}>
        <div className="container mx-auto mt-10">
          <h2 className="text-2xl font-bold mb-5">{t('dashboard')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{t('services')}</h3>
              {data.services.length ? (
                <ul>
                  {data.services.map((service) => (
                    <li key={service._id}>
                      {service.type}: ₹{service.cost} ({service.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent services</p>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{t('transactions')}</h3>
              {data.transactions.length ? (
                <ul>
                  {data.transactions.map((txn) => (
                    <li key={txn._id}>
                      {txn.type}: ₹{txn.amount} (Fee: ₹{txn.fee})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent transactions</p>
              )}
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{t('commissions')}</h3>
              <p>
                {t('total')}: ₹{data.commissions.total} ({data.commissions.commissions.length} unpaid)
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  };

  export default EmployeeDashboard;