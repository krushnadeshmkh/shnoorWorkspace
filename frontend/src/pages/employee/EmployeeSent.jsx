import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../components/layout/EmployeeLayout';
import { emailAPI } from '../../api/emails';
import { formatDistanceToNow } from 'date-fns';
import { FiSend, FiPaperclip, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const EmployeeSent = () => {
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

  const fetchEmails = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        limit: ITEMS_PER_PAGE,
        page: page,
      };
      
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }
      
      const response = await emailAPI.getSent(params);
      
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
      console.error('Error fetching sent emails:', error);
      toast.error('Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchEmails(1);
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => {
      window.removeEventListener('resize', calculateHeight);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchEmails]);

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
  }, [searchQuery, fetchEmails]);

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
    fetchEmails(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <EmployeeLayout>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
          <span className="sr-only">Loading sent emails</span>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div ref={containerRef} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col" style={{ height: containerHeight }}>
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center space-x-2 md:space-x-3">
              <FiSend className="w-4 h-4 md:w-5 md:h-5 text-navy" aria-hidden="true" />
              <h2 className="text-lg md:text-xl font-semibold text-navy">Sent</h2>
              <span className="text-sm text-gray-500" aria-label={`${totalCount} sent emails`}>({totalCount})</span>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 md:p-2 text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100"
              aria-label={showSearch ? 'Close search' : 'Search sent emails'}
            >
              <FiSearch className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            </button>
          </div>
          {showSearch && (
            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search sent emails..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                autoFocus
                aria-label="Search sent emails"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-500">
                <div className="text-4xl md:text-6xl mb-3 md:mb-4" aria-hidden="true">📤</div>
                <p className="text-base md:text-lg font-medium">No sent emails</p>
                <p className="text-xs md:text-sm">Your sent emails will appear here</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => navigate(`/employee/email/${email.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 cursor-pointer transition-colors gap-2 sm:gap-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <span className="font-medium truncate text-sm md:text-base">{email.receiver_name}</span>
                    </div>
                    <div className="mt-0.5">
                      <p className="text-gray-600 truncate text-sm">{email.subject || '(no subject)'}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {email.content?.replace(/<[^>]*>/g, '').substring(0, 100)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 md:space-x-2 ml-2 md:ml-4 flex-shrink-0">
                    {email.has_attachments && (
                      <FiPaperclip className="text-gray-400 text-[10px] md:text-sm" aria-hidden="true" />
                    )}
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
    </EmployeeLayout>
  );
};

export default EmployeeSent;