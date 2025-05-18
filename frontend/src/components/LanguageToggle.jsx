import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-blue-500 text-white p-2 rounded"
        value={i18n.language}
      >
        <option value="en">{t('english')}</option>
        <option value="od">{t('odia')}</option>
      </select>
    </div>
  );
};

export default LanguageToggle;