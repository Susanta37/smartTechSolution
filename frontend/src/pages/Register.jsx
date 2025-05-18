import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { register } from '../redux/authSlice';
import ProtectedRoute from '../components/ProtectedRoute';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee', phone: '', address: '',
  });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(register(formData));
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="container mx-auto mt-10 max-w-md">
        <h2 className="text-2xl font-bold mb-5">{t('register')}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block">{t('name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">{t('phone')}</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">{t('address')}</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded" disabled={loading}>
            {loading ? 'Loading...' : t('submit')}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default Register;