import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { emailAPI } from '../../api/emails';
import { toast } from 'react-toastify';
import { FiX, FiPaperclip, FiSend, FiSave, FiMinus, FiMaximize2, FiChevronDown } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminCompose = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const replyTo = searchParams.get('replyTo');
  const replyAll = searchParams.get('replyAll');
  const forward = searchParams.get('forward');
  const draftId = searchParams.get('draft');

  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [formData, setFormData] = useState({
    receiverEmail: '',
    cc: [],
    bcc: [],
    subject: '',
    content: '',
    attachments: [],
  });

  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  useEffect(() => {
    if (draftId) {
      fetchDraftData();
    } else if (replyTo) {
      fetchReplyData();
    } else if (replyAll) {
      fetchReplyAllData();
    } else if (forward) {
      fetchForwardData();
    }
  }, [draftId, replyTo, replyAll, forward]);

  const fetchDraftData = async () => {
    try {
      const drafts = await emailAPI.getDrafts();
      const draft = drafts.find(d => d.id === parseInt(draftId));
      if (draft) {
        setFormData({
          receiverEmail: draft.receiver_email || '',
          cc: draft.cc ? draft.cc.split(',').filter(Boolean).map(e => e.trim()) : [],
          bcc: draft.bcc ? draft.bcc.split(',').filter(Boolean).map(e => e.trim()) : [],
          subject: draft.subject || '',
          content: draft.content || '',
          attachments: draft.attachments || [],
        });
        if (draft.cc) setShowCC(true);
        if (draft.bcc) setShowBCC(true);
      } else {
        toast.error('Draft not found');
      }
    } catch (error) {
      toast.error('Failed to load draft');
    }
  };

  const fetchReplyData = async () => {
    try {
      const email = await emailAPI.getEmail(replyTo);
      setFormData(prev => ({
        ...prev,
        receiverEmail: email.sender_email || '',
        cc: [],
        bcc: [],
        subject: email.subject && !email.subject.startsWith('Re:') ? `Re: ${email.subject}` : email.subject || 'Re: (no subject)',
        content: `<br><br><hr><p><strong>On ${formatDate(email.created_at)}, ${email.sender_name || 'Sender'} wrote:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }));
      setShowCC(false);
      setShowBCC(false);
    } catch (error) {
      toast.error('Failed to load email for reply');
    }
  };

  const fetchReplyAllData = async () => {
    try {
      const email = await emailAPI.getEmail(replyAll);
      if (email.is_bcc_recipient) {
        toast.warning('You received this as BCC. Reply All is disabled.');
        navigate(`/admin/compose?replyTo=${replyAll}`);
        return;
      }
      const ccRecipients = email.cc_recipients || [];
      const ccEmails = ccRecipients.map(r => r.email).filter(e => e !== email.sender_email);
      setFormData(prev => ({
        ...prev,
        receiverEmail: email.sender_email || '',
        cc: [email.receiver_email || '', ...ccEmails],
        bcc: [],
        subject: email.subject && !email.subject.startsWith('Re:') ? `Re: ${email.subject}` : email.subject || 'Re: (no subject)',
        content: `<br><br><hr><p><strong>On ${formatDate(email.created_at)}, ${email.sender_name || 'Sender'} wrote:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }));
      setShowCC(true);
      setShowBCC(false);
    } catch (error) {
      toast.error('Failed to load email for reply all');
    }
  };

  const fetchForwardData = async () => {
    try {
      const email = await emailAPI.getEmail(forward);
      setFormData(prev => ({
        ...prev,
        receiverEmail: '',
        cc: [],
        bcc: [],
        subject: email.subject && !email.subject.startsWith('Fwd:') ? `Fwd: ${email.subject}` : email.subject || 'Fwd: (no subject)',
        content: `<br><br><hr><p><strong>Forwarded message from ${email.sender_name || 'Sender'} (${email.sender_email || ''}) on ${formatDate(email.created_at)}:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }));
      setShowCC(false);
      setShowBCC(false);
    } catch (error) {
      toast.error('Failed to load email for forward');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'unknown date';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (content) => {
    setFormData({ ...formData, content });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setFormData({ ...formData, attachments: [...formData.attachments, ...files] });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCCKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const email = ccInput.trim();
      if (email) {
        if (!validateEmail(email)) {
          toast.error('Invalid email format');
          setCcInput('');
          return;
        }
        if (formData.cc.includes(email) || formData.receiverEmail === email) {
          toast.warning('Email already added');
          setCcInput('');
          return;
        }
        setFormData(prev => ({ ...prev, cc: [...prev.cc, email] }));
        setCcInput('');
      }
    } else if (e.key === 'Backspace' && !ccInput && formData.cc.length > 0) {
      setFormData(prev => ({ ...prev, cc: prev.cc.slice(0, -1) }));
    }
  };

  const handleBCCKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const email = bccInput.trim();
      if (email) {
        if (!validateEmail(email)) {
          toast.error('Invalid email format');
          setBccInput('');
          return;
        }
        if (formData.bcc.includes(email) || formData.cc.includes(email) || formData.receiverEmail === email) {
          toast.warning('Email already added');
          setBccInput('');
          return;
        }
        setFormData(prev => ({ ...prev, bcc: [...prev.bcc, email] }));
        setBccInput('');
      }
    } else if (e.key === 'Backspace' && !bccInput && formData.bcc.length > 0) {
      setFormData(prev => ({ ...prev, bcc: prev.bcc.slice(0, -1) }));
    }
  };

  const handleCCBlur = () => {
    if (ccInput.trim()) {
      const email = ccInput.trim();
      if (validateEmail(email) && !formData.cc.includes(email) && formData.receiverEmail !== email) {
        setFormData(prev => ({ ...prev, cc: [...prev.cc, email] }));
      }
      setCcInput('');
    }
  };

  const handleBCCBlur = () => {
    if (bccInput.trim()) {
      const email = bccInput.trim();
      if (validateEmail(email) && !formData.bcc.includes(email) && !formData.cc.includes(email) && formData.receiverEmail !== email) {
        setFormData(prev => ({ ...prev, bcc: [...prev.bcc, email] }));
      }
      setBccInput('');
    }
  };

  const removeCC = (index) => {
    setFormData(prev => ({ ...prev, cc: prev.cc.filter((_, i) => i !== index) }));
  };

  const removeBCC = (index) => {
    setFormData(prev => ({ ...prev, bcc: prev.bcc.filter((_, i) => i !== index) }));
  };

  const getRecipientCount = () => {
    let count = 0;
    if (formData.receiverEmail) count++;
    count += formData.cc.length;
    count += formData.bcc.length;
    return count;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.receiverEmail) {
      toast.error('Please enter a recipient email');
      return;
    }
    const sendData = {
      ...formData,
      cc: formData.cc.join(','),
      bcc: formData.bcc.join(','),
    };
    setLoading(true);
    try {
      const response = await emailAPI.sendEmail(sendData);
      if (draftId) await emailAPI.deleteDraft(draftId);
      toast.success(`Email sent to ${getRecipientCount()} recipient${getRecipientCount() > 1 ? 's' : ''}`);
      navigate('/admin/sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        ...formData,
        cc: formData.cc.join(','),
        bcc: formData.bcc.join(','),
      };
      if (draftId) await emailAPI.deleteDraft(draftId);
      await emailAPI.saveDraft(draftData);
      toast.success('Draft saved successfully');
      navigate('/admin/drafts');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const getTitle = () => {
    if (draftId) return 'Edit draft';
    if (replyTo) return 'Reply';
    if (replyAll) return 'Reply all';
    if (forward) return 'Forward';
    return 'New message';
  };

  const modules = {
    toolbar: false,
    clipboard: { matchVisual: false }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 z-50">
        <div 
          className="bg-[#404144] text-white px-4 py-2.5 rounded-t-lg cursor-pointer flex items-center justify-between min-w-[280px] hover:bg-[#4a4b4d] transition-colors"
          onClick={() => setIsMinimized(false)}
        >
          <span className="text-sm font-medium truncate">{getTitle()}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">{formData.receiverEmail || 'No recipients'}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/admin/inbox'); }}
              className="text-gray-300 hover:text-white p-0.5"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-8 z-50 w-[640px] max-w-[95vw]">
      <div className={`bg-white rounded-t-2xl shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden ${isMaximized ? 'fixed inset-4 z-50 max-w-none' : ''}`}>
        <div className="flex items-center justify-between bg-[#404144] px-4 py-2.5">
          <h2 className="text-sm font-medium text-white tracking-wide">{getTitle()}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 text-gray-300 hover:text-white rounded transition-colors"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 text-gray-300 hover:text-white rounded transition-colors"
            >
              <FiMaximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/admin/inbox')}
              className="p-1 text-gray-300 hover:text-white rounded transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSend}>
          <div className="px-4">
            <div className="flex items-center py-2 border-b border-gray-200">
              <label className="text-sm text-gray-500 w-12 flex-shrink-0">To</label>
              <input
                type="email"
                name="receiverEmail"
                value={formData.receiverEmail}
                onChange={handleChange}
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent py-0.5 placeholder:text-gray-400"
                placeholder="Recipients"
                required={!replyTo && !replyAll && !draftId}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCC(!showCC)}
                  className={`text-xs transition-colors ${showCC ? 'text-[#1a73e8] font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Cc
                </button>
                <button
                  type="button"
                  onClick={() => setShowBCC(!showBCC)}
                  className={`text-xs transition-colors ${showBCC ? 'text-[#1a73e8] font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Bcc
                </button>
              </div>
            </div>

            {showCC && (
              <div className="flex items-start py-2 border-b border-gray-200">
                <label className="text-sm text-gray-500 w-12 flex-shrink-0 pt-0.5">Cc</label>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 items-center">
                    {formData.cc.map((email, index) => (
                      <span key={index} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 pl-2.5 pr-1 py-0.5 rounded-full text-xs">
                        <span className="max-w-[150px] truncate">{email}</span>
                        <button type="button" onClick={() => removeCC(index)} className="hover:bg-gray-300 rounded-full p-0.5">
                          <FiX className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={handleCCKeyDown}
                      onBlur={handleCCBlur}
                      placeholder=""
                      className="flex-1 min-w-[80px] outline-none text-sm bg-transparent py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {showBCC && (
              <div className="flex items-start py-2 border-b border-gray-200">
                <label className="text-sm text-gray-500 w-12 flex-shrink-0 pt-0.5">Bcc</label>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 items-center">
                    {formData.bcc.map((email, index) => (
                      <span key={index} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 pl-2.5 pr-1 py-0.5 rounded-full text-xs">
                        <span className="max-w-[150px] truncate">{email}</span>
                        <button type="button" onClick={() => removeBCC(index)} className="hover:bg-amber-200 rounded-full p-0.5">
                          <FiX className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={bccInput}
                      onChange={(e) => setBccInput(e.target.value)}
                      onKeyDown={handleBCCKeyDown}
                      onBlur={handleBCCBlur}
                      placeholder=""
                      className="flex-1 min-w-[80px] outline-none text-sm bg-transparent py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {getRecipientCount() > 0 && (
              <div className="flex items-center py-1">
                <span className="text-xs text-gray-400 ml-12">
                  {getRecipientCount()} recipient{getRecipientCount() > 1 ? 's' : ''}
                  {formData.bcc.length > 0 && (
                    <span className="text-amber-600 ml-1">({formData.bcc.length} Bcc hidden)</span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center py-2 border-b border-gray-200">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent py-0.5 placeholder:text-gray-400"
                placeholder="Subject"
                required
              />
            </div>
          </div>

          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={formData.content}
            onChange={handleContentChange}
            modules={modules}
            placeholder="Compose your message..."
            className="quill-gmail h-48 border-0"
          />

          {formData.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-gray-100">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 pl-2.5 pr-1.5 py-1 rounded-lg">
                  <FiPaperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate max-w-[120px]">{file.name || file.file_name}</span>
                  <button type="button" onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
            <div className="flex items-center gap-0.5">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] hover:shadow-md rounded-full transition-all disabled:opacity-50"
              >
                <FiSend className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-1.5 ml-0.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach files"
              >
                <FiPaperclip className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiSave className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
            <span className="text-[10px] text-gray-400">Max 5 files</span>
          </div>
        </form>
      </div>

      <style>{`
        .quill-gmail .ql-container {
          border: none;
          font-family: inherit;
          font-size: 13px;
        }
        .quill-gmail .ql-editor {
          padding: 12px 16px;
          min-height: 100%;
        }
        .quill-gmail .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9aa0a6;
          left: 16px;
        }
        .quill-gmail .ql-editor blockquote {
          border-left: 3px solid #dadce0;
          padding-left: 12px;
          color: #5f6368;
          margin: 6px 0;
        }
      `}</style>
    </div>
  );
};

export default AdminCompose;