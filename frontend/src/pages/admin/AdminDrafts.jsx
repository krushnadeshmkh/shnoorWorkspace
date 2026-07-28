import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { emailAPI } from '../../api/emails';
import { formatDistanceToNow } from 'date-fns';
import { FiFileText, FiEdit, FiTrash2, FiEdit2, FiSend, FiSave, FiMinus, FiX, FiMaximize2, FiPaperclip, FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ReactQuill = lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';

const AdminDrafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerHeight, setContainerHeight] = useState('100%');
  const containerRef = useRef(null);

  const [showCompose, setShowCompose] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [composeLoading, setComposeLoading] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const quillRef = useRef(null);

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

  const ITEMS_PER_PAGE = 10;

  const fetchDrafts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        limit: ITEMS_PER_PAGE,
        page: page,
      };
      
      const response = await emailAPI.getDrafts(params);
      
      if (response && response.drafts) {
        setDrafts(response.drafts);
        setCurrentPage(response.page || page);
        setTotalCount(response.total || response.drafts.length);
      } else if (Array.isArray(response)) {
        setDrafts(response);
        setTotalCount(response.length);
      } else {
        setDrafts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts(1);
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [fetchDrafts]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const calculateHeight = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const availableHeight = window.innerHeight - rect.top - 20;
        setContainerHeight(`${availableHeight}px`);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / ITEMS_PER_PAGE)) return;
    fetchDrafts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('Delete this draft?')) {
      try {
        await emailAPI.deleteDraft(draftId);
        toast.success('Draft deleted');
        fetchDrafts(currentPage);
      } catch (error) {
        toast.error('Failed to delete draft');
      }
    }
  };

  const openDraftInCompose = (draft) => {
    setEditingDraftId(draft.id);
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
    setShowCompose(true);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  const handleNewDraft = () => {
    setEditingDraftId(null);
    setFormData({
      receiverEmail: '',
      cc: [],
      bcc: [],
      subject: '',
      content: '',
      attachments: [],
    });
    setShowCC(false);
    setShowBCC(false);
    setCcInput('');
    setBccInput('');
    setShowCompose(true);
    setIsMinimized(false);
    setIsMaximized(false);
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
    setComposeLoading(true);
    try {
      await emailAPI.sendEmail(sendData);
      if (editingDraftId) {
        await emailAPI.deleteDraft(editingDraftId);
      }
      toast.success(`Email sent to ${getRecipientCount()} recipient${getRecipientCount() > 1 ? 's' : ''}`);
      setShowCompose(false);
      fetchDrafts(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setComposeLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        ...formData,
        cc: formData.cc.join(','),
        bcc: formData.bcc.join(','),
      };
      if (editingDraftId) {
        await emailAPI.deleteDraft(editingDraftId);
      }
      await emailAPI.saveDraft(draftData);
      toast.success('Draft saved successfully');
      setShowCompose(false);
      fetchDrafts(currentPage);
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleFormatAction = (format) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range && range.length > 0) {
        if (format === 'bold') {
          quill.format('bold', !quill.getFormat(range).bold);
        } else if (format === 'italic') {
          quill.format('italic', !quill.getFormat(range).italic);
        } else if (format === 'underline') {
          quill.format('underline', !quill.getFormat(range).underline);
        } else if (format === 'strike') {
          quill.format('strike', !quill.getFormat(range).strike);
        } else if (format === 'blockquote') {
          quill.format('blockquote', !quill.getFormat(range).blockquote);
        } else if (format === 'header') {
          quill.format('header', !quill.getFormat(range).header ? 1 : false);
        } else if (format === 'list-ordered') {
          quill.format('list', 'ordered');
        } else if (format === 'list-bullet') {
          quill.format('list', 'bullet');
        } else if (format === 'align-left') {
          quill.format('align', 'left');
        } else if (format === 'align-center') {
          quill.format('align', 'center');
        } else if (format === 'align-right') {
          quill.format('align', 'right');
        } else if (format === 'clean') {
          quill.removeFormat(range);
        }
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const modules = {
    toolbar: false,
    clipboard: { matchVisual: false }
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'blockquote',
    'list', 'bullet',
    'align'
  ];

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4);
      }
      
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3);
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (loading && drafts.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
          <span className="sr-only">Loading drafts</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout>
        <div ref={containerRef} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col" style={{ height: containerHeight }}>
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center space-x-2 md:space-x-3">
                <FiFileText className="w-4 h-4 md:w-5 md:h-5 text-navy" aria-hidden="true" />
                <h2 className="text-lg md:text-xl font-semibold text-navy">Drafts</h2>
                <span className="text-sm text-gray-500" aria-label={`${totalCount} total drafts`}>({totalCount})</span>
              </div>
              <button
                onClick={handleNewDraft}
                className="bg-navy text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium"
                aria-label="Create new draft"
              >
                <FiEdit2 className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span>New Draft</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-500">
                  <div className="text-4xl md:text-6xl mb-3 md:mb-4" aria-hidden="true">📝</div>
                  <p className="text-base md:text-lg font-medium">No drafts</p>
                  <p className="text-xs md:text-sm">Your saved drafts will appear here</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex flex-wrap items-center px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openDraftInCompose(draft)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FiFileText className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                        <p className="font-medium text-navy truncate text-sm md:text-base">
                          {draft.subject || '(no subject)'}
                        </p>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 truncate ml-6">
                        To: {draft.receiver_email || 'No recipient'}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-400 ml-6 mt-0.5 md:mt-1">
                        Last edited {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                      </p>
                      {draft.content && (
                        <p className="text-xs text-gray-400 truncate ml-6 mt-0.5">
                          {draft.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 ml-2 md:ml-4 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDraftInCompose(draft)}
                        className="p-1.5 md:p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        aria-label="Edit draft"
                      >
                        <FiEdit className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-1.5 md:p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        aria-label="Delete draft"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {totalCount > 0 && (
            <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs md:text-sm text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} drafts
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-navy'
                  }`}
                  aria-label="Previous page"
                >
                  <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                          pageNum === currentPage
                            ? 'bg-navy text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                    currentPage >= totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-navy'
                  }`}
                  aria-label="Next page"
                >
                  <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>

      {showCompose && (
        <div className="fixed bottom-0 right-8 z-50 flex items-end justify-end">
          <div
            className={`bg-white rounded-t-2xl shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-200 ${
              isMaximized ? 'fixed inset-4 z-50' : 'w-[740px] max-w-[95vw]'
            }`}
          >
            <div className="flex items-center justify-between bg-[#404144] px-4 py-2.5">
              <h2 className="text-sm font-medium text-white tracking-wide">{editingDraftId ? 'Edit draft' : 'New draft'}</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-300 hover:text-white rounded transition-colors"
                  aria-label="Minimize compose window"
                >
                  <FiMinus className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1 text-gray-300 hover:text-white rounded transition-colors"
                  aria-label={isMaximized ? 'Restore down' : 'Maximize compose window'}
                >
                  <FiMaximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-1 text-gray-300 hover:text-white rounded transition-colors"
                  aria-label="Close compose"
                >
                  <FiX className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSend} className={`${isMaximized ? 'h-[calc(100%-52px)] flex flex-col' : ''}`} onContextMenu={handleContextMenu}>
              <div className="px-4 flex-shrink-0">
                <div className="flex items-center py-2 border-b border-gray-200">
                  <label className="text-sm text-gray-500 w-12 flex-shrink-0">To</label>
                  <input
                    type="email"
                    name="receiverEmail"
                    value={formData.receiverEmail}
                    onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                    className="flex-1 outline-none text-sm text-gray-800 bg-transparent py-0.5 placeholder:text-gray-400"
                    placeholder="Recipients"
                    required
                    aria-label="Recipient email"
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
                            <button type="button" onClick={() => removeCC(index)} className="hover:bg-gray-300 rounded-full p-0.5" aria-label={`Remove ${email} from CC`}>
                              <FiX className="w-2.5 h-2.5" aria-hidden="true" />
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
                          aria-label="Add CC recipient"
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
                            <button type="button" onClick={() => removeBCC(index)} className="hover:bg-amber-200 rounded-full p-0.5" aria-label={`Remove ${email} from BCC`}>
                              <FiX className="w-2.5 h-2.5" aria-hidden="true" />
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
                          aria-label="Add BCC recipient"
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
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="flex-1 outline-none text-sm text-gray-800 bg-transparent py-0.5 placeholder:text-gray-400"
                    placeholder="Subject"
                    required
                    aria-label="Email subject"
                  />
                </div>
              </div>

              <div className={`${isMaximized ? 'flex-1' : ''}`} onContextMenu={handleContextMenu}>
                <Suspense fallback={<div className="h-48 flex items-center justify-center">Loading editor...</div>}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    modules={modules}
                    formats={formats}
                    placeholder="Compose your message..."
                    className={`quill-gmail border-0 ${isMaximized ? 'h-full' : 'h-48'}`}
                  />
                </Suspense>
              </div>

              {contextMenu.visible && (
                <div
                  className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 min-w-[200px]"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-400 border-b border-gray-100 mb-1">
                    Format text
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('bold')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiBold className="w-4 h-4" aria-hidden="true" />
                    Bold
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('italic')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiItalic className="w-4 h-4" aria-hidden="true" />
                    Italic
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('underline')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiUnderline className="w-4 h-4" aria-hidden="true" />
                    Underline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('strike')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <span className="line-through w-4">S</span>
                    Strikethrough
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('header')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <span className="font-bold text-base w-4">H</span>
                    Heading
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('blockquote')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <span className="text-gray-400 w-4">"</span>
                    Quote
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('list-ordered')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiList className="w-4 h-4" aria-hidden="true" />
                    Numbered list
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('list-bullet')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <span className="text-xl w-4">•</span>
                    Bullet list
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('align-left')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiAlignLeft className="w-4 h-4" aria-hidden="true" />
                    Align left
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('align-center')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiAlignCenter className="w-4 h-4" aria-hidden="true" />
                    Align center
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('align-right')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                  >
                    <FiAlignRight className="w-4 h-4" aria-hidden="true" />
                    Align right
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => handleFormatAction('clean')}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-400"
                  >
                    Remove formatting
                  </button>
                </div>
              )}

              {formData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-gray-100 flex-shrink-0">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 pl-2.5 pr-1.5 py-1 rounded-lg">
                      <FiPaperclip className="w-3 h-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs text-gray-600 truncate max-w-[120px]">{file.name || file.file_name}</span>
                      <button type="button" onClick={() => removeAttachment(index)} className="text-gray-400 hover:text-gray-600" aria-label={`Remove attachment ${file.name || file.file_name}`}>
                        <FiX className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <button
                    type="submit"
                    disabled={composeLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] hover:shadow-md rounded-full transition-all disabled:opacity-50"
                    aria-label="Send email"
                  >
                    <FiSend className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{composeLoading ? 'Sending...' : 'Send'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="p-1.5 ml-0.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Attach files"
                  >
                    <FiPaperclip className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    aria-label="Attach files"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Save draft"
                  >
                    <FiSave className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save</span>
                  </button>
                </div>
                <span className="text-[10px] text-gray-400">Max 5 files</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompose && isMinimized && (
        <div className="fixed bottom-0 right-8 z-50">
          <div
            className="bg-[#404144] text-white px-4 py-2.5 rounded-t-lg cursor-pointer flex items-center justify-between min-w-[280px] hover:bg-[#4a4b4d] transition-colors"
            onClick={() => setIsMinimized(false)}
          >
            <span className="text-sm font-medium truncate">{editingDraftId ? 'Edit draft' : 'New draft'}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">{formData.receiverEmail || 'No recipients'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCompose(false); }}
                className="text-gray-300 hover:text-white p-0.5"
                aria-label="Close compose"
              >
                <FiX className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

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
        .quill-gmail .ql-toolbar {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default AdminDrafts;