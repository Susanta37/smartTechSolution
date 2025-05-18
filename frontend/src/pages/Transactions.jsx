import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../redux/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ customerId: '', type: 'deposit', amount: '' });
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/api/transactions').then((res) => setTransactions(res.data));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/api/transactions', { ...formData, status: 'completed' });
    const res = await api.get('/api/transactions');
    setTransactions(res.data);
    setFormData({ customerId: '', type: 'deposit', amount: '' });
  };

  return (
    <div className="container mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-5">{t('transactions')}</h2>
      <form onSubmit={handleSubmit} className="mb-10 space-y-4 max-w-md">
        <div>
          <label className="block">Customer ID</label>
          <input
            type="text"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="deposit">{t('deposits')}</option>
            <option value="withdrawal">{t('withdrawals')}</option>
          </select>
        </div>
        <div>
          <label className="block">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">{t('submit')}</button>
      </form>
      <h3 className="text-lg font-semibold">Transaction History</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Type</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Fee</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn._id}>
              <td className="border p-2">{txn.type}</td>
              <td className="border p-2">₹{txn.amount}</td>
              <td className="border p-2">₹{txn.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;