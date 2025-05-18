import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../redux/api';
import ProtectedRoute from '../components/ProtectedRoute';

const CashHistory = () => {
  const [cashHistory, setCashHistory] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    drawer: '',
    wallet: '',
    ledger: '',
    principal: '',
    borrow: [{ userId: '', amount: '' }],
  });
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/api/cash-history').then((res) => setCashHistory(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('borrow.')) {
      const [_, index, field] = name.split('.');
      const newBorrow = [...formData.borrow];
      newBorrow[index][field] = value;
      setFormData({ ...formData, borrow: newBorrow });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/api/cash-history', formData);
    const res = await api.get('/api/cash-history');
    setCashHistory(res.data);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      drawer: '',
      wallet: '',
      ledger: '',
      principal: '',
      borrow: [{ userId: '', amount: '' }],
    });
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="container mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-5">{t('cashHistory')}</h2>
        <form onSubmit={handleSubmit} className="mb-10 space-y-4 max-w-md">
          <div>
            <label className="block">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('drawer')}</label>
            <input
              type="number"
              name="drawer"
              value={formData.drawer}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('wallet')}</label>
            <input
              type="number"
              name="wallet"
              value={formData.wallet}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('ledger')}</label>
            <input
              type="number"
              name="ledger"
              value={formData.ledger}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('principal')}</label>
            <input
              type="number"
              name="principal"
              value={formData.principal}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">Borrow User ID</label>
            <input
              type="text"
              name="borrow.0.userId"
              value={formData.borrow[0].userId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              name="borrow.0.amount"
              value={formData.borrow[0].amount}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-2"
              placeholder="Amount"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">{t('submit')}</button>
        </form>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Date</th>
              <th className="border p-2">{t('drawer')}</th>
              <th className="border p-2">{t('wallet')}</th>
              <th className="border p-2">{t('ledger')}</th>
              <th className="border p-2">{t('principal')}</th>
              <th className="border p-2">{t('profit')}</th>
            </tr>
          </thead>
          <tbody>
            {cashHistory.map((record) => (
              <tr key={record._id}>
                <td className="border p-2">{new Date(record.date).toLocaleDateString()}</td>
                <td className="border p-2">₹{record.drawer}</td>
                <td className="border p-2">₹{record.wallet}</td>
                <td className="border p-2">₹{record.ledger}</td>
                <td className="border p-2">₹{record.principal}</td>
                <td className="border p-2">₹{record.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
};

export default CashHistory;