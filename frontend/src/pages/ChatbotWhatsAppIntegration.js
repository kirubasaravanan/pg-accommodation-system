import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://192.168.x.x:5000'; // Update to your LAN IP

const initialValues = {
  whatsappBusinessNumber: '',
  whatsappStatus: false,
  adminNumbers: ['', ''],
  webhookUrl: '',
  chatbotModel: 'gpt-3.5-turbo',
  enableRegistration: false,
  enableComplaints: false,
  enableChatbot: false,
  adminVerified: false,
};

const validationSchema = Yup.object({
  whatsappBusinessNumber: Yup.string().required('Required'),
  adminNumbers: Yup.array().of(
    Yup.string().matches(/^\+?\d{10,15}$/, 'Invalid phone number')
  ),
  webhookUrl: Yup.string().url('Invalid URL'),
});

const ChatbotWhatsAppIntegration = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch config from backend
    const token = localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/api/settings/chatbot-whatsapp`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setAdminVerified(res.data.adminVerified);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVerifyAdmin = (number, setFieldValue) => {
    // Simulate verification (should be replaced with real OTP flow)
    setTimeout(() => {
      setAdminVerified(true);
      setFieldValue('adminVerified', true);
      alert('Admin number verified!');
    }, 1000);
  };

  const handleSubmit = (values, { setSubmitting }) => {
    setError('');
    setSaved(false);
    const token = localStorage.getItem('token');
    axios.post(`${API_BASE_URL}/api/settings/chatbot-whatsapp`, values, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setSaved(true);
        setSubmitting(false);
      })
      .catch(err => {
        setError('Failed to save settings.');
        setSubmitting(false);
      });
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      <button
        className="mb-4 text-blue-600 underline text-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-6">Chatbot & WhatsApp Integration</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <label className="block font-semibold mb-1">WhatsApp Business Number</label>
              <Field name="whatsappBusinessNumber" className="w-full border rounded px-3 py-2" placeholder="+91..." />
              <ErrorMessage name="whatsappBusinessNumber" component="div" className="text-red-500 text-sm" />
            </div>
            <div>
              <label className="block font-semibold mb-1">WhatsApp Integration Status</label>
              <Field type="checkbox" name="whatsappStatus" className="mr-2" /> Enabled
            </div>
            <div>
              <label className="block font-semibold mb-1">Admin Numbers (max 2)</label>
              {values.adminNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <Field name={`adminNumbers[${idx}]`} className="w-full border rounded px-3 py-2" placeholder="+91..." />
                  {!adminVerified && num && (
                    <button type="button" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded" onClick={() => handleVerifyAdmin(num, setFieldValue)}>Verify</button>
                  )}
                </div>
              ))}
              <ErrorMessage name="adminNumbers" component="div" className="text-red-500 text-sm" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Webhook URL</label>
              <Field name="webhookUrl" className="w-full border rounded px-3 py-2" placeholder="https://..." />
              <ErrorMessage name="webhookUrl" component="div" className="text-red-500 text-sm" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Chatbot Model</label>
              <Field as="select" name="chatbotModel" className="w-full border rounded px-3 py-2">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
              </Field>
            </div>
            <div className="flex gap-4">
              <label><Field type="checkbox" name="enableRegistration" className="mr-2" /> Enable Registration</label>
              <label><Field type="checkbox" name="enableComplaints" className="mr-2" /> Enable Complaints</label>
              <label><Field type="checkbox" name="enableChatbot" className="mr-2" /> Enable Chatbot</label>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {saved && <div className="text-green-600">Settings saved!</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={isSubmitting || !adminVerified}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
            {!adminVerified && <div className="text-yellow-600 text-sm mt-2">Admin number must be verified to save settings.</div>}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ChatbotWhatsAppIntegration;
