import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { emailAPI } from '../../api/emails'
import { toast } from 'react-toastify'
import { FiX, FiPaperclip, FiSend, FiSave } from 'react-icons/fi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const EmployeeCompose = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const replyTo = searchParams.get('replyTo')
  const replyAll = searchParams.get('replyAll')
  const forward = searchParams.get('forward')
  const draftId = searchParams.get('draft')
  
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [showCC, setShowCC] = useState(false)
  const [showBCC, setShowBCC] = useState(false)
  const [formData, setFormData] = useState({
    receiverEmail: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
    attachments: [],
  })

  useEffect(() => {
    if (draftId) {
      fetchDraftData()
    } else if (replyTo) {
      fetchReplyData()
    } else if (replyAll) {
      fetchReplyAllData()
    } else if (forward) {
      fetchForwardData()
    }
  }, [draftId, replyTo, replyAll, forward])

  const fetchDraftData = async () => {
    try {
      const drafts = await emailAPI.getDrafts()
      const draft = drafts.find(d => d.id === parseInt(draftId))
      
      if (draft) {
        setFormData({
          receiverEmail: draft.receiver_email || '',
          cc: draft.cc || '',
          bcc: draft.bcc || '',
          subject: draft.subject || '',
          content: draft.content || '',
          attachments: draft.attachments || [],
        })
        if (draft.cc) setShowCC(true)
        if (draft.bcc) setShowBCC(true)
      } else {
        toast.error('Draft not found')
      }
    } catch (error) {
      console.error('Error fetching draft:', error)
      toast.error('Failed to load draft')
    }
  }

  const fetchReplyData = async () => {
    try {
      const email = await emailAPI.getEmail(replyTo)
      const senderName = email.sender_name || 'Sender'
      const senderEmail = email.sender_email || ''
      
      setFormData(prev => ({
        ...prev,
        receiverEmail: senderEmail,
        cc: '',
        bcc: '',
        subject: email.subject && !email.subject.startsWith('Re:') ? `Re: ${email.subject}` : email.subject || 'Re: (no subject)',
        content: `<br><br><hr><p><strong>On ${formatDate(email.created_at)}, ${senderName} wrote:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }))
      setShowCC(false)
      setShowBCC(false)
    } catch (error) {
      console.error('Error fetching email for reply:', error)
      toast.error('Failed to load email for reply')
    }
  }

  const fetchReplyAllData = async () => {
    try {
      const email = await emailAPI.getEmail(replyAll)
      const senderName = email.sender_name || 'Sender'
      const senderEmail = email.sender_email || ''
      const receiverEmail = email.receiver_email || ''
      
      setFormData(prev => ({
        ...prev,
        receiverEmail: senderEmail,
        cc: receiverEmail,
        bcc: '',
        subject: email.subject && !email.subject.startsWith('Re:') ? `Re: ${email.subject}` : email.subject || 'Re: (no subject)',
        content: `<br><br><hr><p><strong>On ${formatDate(email.created_at)}, ${senderName} wrote:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }))
      setShowCC(true)
      setShowBCC(false)
    } catch (error) {
      console.error('Error fetching email for reply all:', error)
      toast.error('Failed to load email for reply all')
    }
  }

  const fetchForwardData = async () => {
    try {
      const email = await emailAPI.getEmail(forward)
      const senderName = email.sender_name || 'Sender'
      const senderEmail = email.sender_email || ''
      
      setFormData(prev => ({
        ...prev,
        receiverEmail: '',
        cc: '',
        bcc: '',
        subject: email.subject && !email.subject.startsWith('Fwd:') ? `Fwd: ${email.subject}` : email.subject || 'Fwd: (no subject)',
        content: `<br><br><hr><p><strong>Forwarded message from ${senderName} (${senderEmail}) on ${formatDate(email.created_at)}:</strong></p><blockquote>${email.content || ''}</blockquote>`,
      }))
      setShowCC(false)
      setShowBCC(false)
    } catch (error) {
      console.error('Error fetching email for forward:', error)
      toast.error('Failed to load email for forward')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'unknown date'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content,
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files],
    })
  }

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    
    if (!formData.receiverEmail) {
      toast.error('Please enter a recipient email')
      return
    }

    setLoading(true)
    try {
      const response = await emailAPI.sendEmail(formData)
      
      if (draftId) {
        await emailAPI.deleteDraft(draftId)
      }
      
      toast.info('Email sent', {
        autoClose: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await emailAPI.undoSend(response.email.id)
              toast.success('Email unsent')
            } catch (error) {
              toast.error('Failed to undo')
            }
          }
        }
      })
      navigate('/employee/sent')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      if (draftId) {
        await emailAPI.deleteDraft(draftId)
      }
      await emailAPI.saveDraft(formData)
      toast.success('Draft saved successfully')
      navigate('/employee/drafts')
    } catch (error) {
      toast.error('Failed to save draft')
    }
  }

  const getTitle = () => {
    if (draftId) return 'Edit Draft'
    if (replyTo) return 'Reply'
    if (replyAll) return 'Reply All'
    if (forward) return 'Forward'
    return 'Compose New Email'
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  }

  return (
    <EmployeeLayout>
      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-navy">{getTitle()}</h2>
          <button
            onClick={() => navigate('/employee/drafts')}
            className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-3 md:space-y-4">
          <div>
            <label className="input-label text-sm">To</label>
            <input
              type="email"
              name="receiverEmail"
              value={formData.receiverEmail}
              onChange={handleChange}
              className="input-field text-sm"
              placeholder="recipient@company.com"
              required={!replyTo && !replyAll && !draftId}
            />
          </div>

          <div className="flex flex-wrap items-center space-x-2 md:space-x-3 text-xs md:text-sm">
            <button
              type="button"
              onClick={() => setShowCC(!showCC)}
              className={`font-medium ${showCC ? 'text-navy' : 'text-gray-400 hover:text-navy'}`}
            >
              CC
            </button>
            <button
              type="button"
              onClick={() => setShowBCC(!showBCC)}
              className={`font-medium ${showBCC ? 'text-navy' : 'text-gray-400 hover:text-navy'}`}
            >
              BCC
            </button>
          </div>

          {showCC && (
            <div>
              <label className="input-label text-sm">CC</label>
              <input
                type="email"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="cc@company.com"
              />
            </div>
          )}

          {showBCC && (
            <div>
              <label className="input-label text-sm">BCC</label>
              <input
                type="email"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="bcc@company.com"
              />
            </div>
          )}

          <div>
            <label className="input-label text-sm">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="input-field text-sm"
              placeholder="Enter subject"
              required
            />
          </div>

          <div>
            <label className="input-label text-sm">Message</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={modules}
                placeholder="Write your message here..."
                className="h-48 md:h-64"
              />
            </div>
          </div>

          {formData.attachments.length > 0 && (
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-xs md:text-sm font-medium text-gray-700">Attachments:</p>
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg">
                  <span className="text-xs md:text-sm text-gray-600 truncate">{file.name || file.file_name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                  >
                    <FiX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="btn-secondary flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm"
              >
                <FiPaperclip className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Attach Files</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <span className="text-[10px] md:text-xs text-gray-500">Max 5 files, 10MB each</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-secondary flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm"
              >
                <FiSave className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Save Draft</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm"
              >
                <FiSend className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{loading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeCompose