import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { emailAPI } from '../../api/emails';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiRefreshCw, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminTrash = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [containerHeight, setContainerHeight] = useState('100%');
  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchEmails(1);
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => {
      window.removeEventListener('resize', calculateHeight);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchEmails(1);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

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

  const fetchEmails = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        limit: ITEMS_PER_PAGE,
        page: page,
      };
      
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }
      
      const response = await emailAPI.getTrash(params);
      
      if (response && response.emails) {
        setEmails(response.emails);
        setCurrentPage(response.page || page);
        setTotalCount(response.total || response.emails.length);
      } else if (Array.isArray(response)) {
        setEmails(response);
        setTotalCount(response.length);
      } else {
        setEmails([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching trash emails:', error);
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / ITEMS_PER_PAGE)) return;
    fetchEmails(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUndo = async (emailId) => {
    try {
      await emailAPI.undoDelete(emailId);
      toast.success('Email restored');
      fetchEmails(currentPage);
    } catch (error) {
      toast.error('Failed to restore email');
    }
  };

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
  }, []);

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

  if (loading && emails.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div ref={containerRef} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col" style={{ height: containerHeight }}>
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center space-x-2 md:space-x-3">
              <FiTrash2 className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <h2 className="text-lg md:text-xl font-semibold text-navy">Trash</h2>
              <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 md:p-2 text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100"
              title="Search"
            >
              <FiSearch className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          {showSearch && (
            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search trash..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-500">
                <div className="text-4xl md:text-6xl mb-3 md:mb-4">🗑️</div>
                <p className="text-base md:text-lg font-medium">Trash is empty</p>
                <p className="text-xs md:text-sm">Deleted emails will appear here</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className="flex flex-wrap items-start md:items-center px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors gap-2 md:gap-0"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/admin/email/${email.id}`)}>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
                      <span className="font-medium truncate text-sm md:text-base">{email.sender_name}</span>
                      <span className="px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs bg-gray-200 text-gray-700 rounded-full flex-shrink-0">Deleted</span>
                    </div>
                    <div className="mt-0.5">
                      <p className="text-gray-600 truncate text-sm">{email.subject || '(no subject)'}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {email.content?.replace(/<[^>]*>/g, '').substring(0, 100)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 md:space-x-2 ml-2 md:ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleUndo(email.id)}
                      className="p-1 md:p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Restore"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <span className="text-[10px] md:text-sm text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs md:text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} emails
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
              >
                <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
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
              >
                <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTrash;