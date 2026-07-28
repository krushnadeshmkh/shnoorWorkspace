import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { emailAPI } from '../../api/emails'
import { FiPlus, FiTrash2, FiX, FiTag } from 'react-icons/fi'
import { toast } from 'react-toastify'

const AdminLabels = () => {
  const navigate = useNavigate()
  const [labels, setLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [containerHeight, setContainerHeight] = useState('100%')
  const containerRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  })

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#22D3EE',
    '#F43F5E', '#84CC16', '#06B6D4', '#8B5CF6', '#F472B6'
  ]

  useEffect(() => {
    fetchLabels()
    calculateHeight()
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  const calculateHeight = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const parentRect = containerRef.current.parentElement?.getBoundingClientRect()
      if (parentRect) {
        const availableHeight = window.innerHeight - rect.top - 20
        setContainerHeight(`${availableHeight}px`)
      }
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await emailAPI.getLabels()
      setLabels(response || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
      toast.error('Failed to load labels')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLabel = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Label name is required')
      return
    }

    try {
      await emailAPI.createLabel(formData)
      toast.success('Label created successfully')
      setFormData({ name: '', color: '#3B82F6' })
      setShowModal(false)
      fetchLabels()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create label')
    }
  }

  const handleDeleteLabel = async (labelId) => {
    if (window.confirm('Delete this label?')) {
      try {
        await emailAPI.deleteLabel(labelId)
        toast.success('Label deleted')
        fetchLabels()
      } catch (error) {
        toast.error('Failed to delete label')
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div ref={containerRef} className="max-w-4xl mx-auto px-2 sm:px-0 w-full bg-white rounded-xl shadow-card overflow-hidden flex flex-col" style={{ height: containerHeight }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-navy">Labels</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">Organize your emails with custom labels</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', color: '#3B82F6' })
              setShowModal(true)
            }}
            className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2"
          >
            <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            New Label
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {labels.length === 0 ? (
            <div className="text-center py-12 md:py-16 text-gray-500">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🏷️</div>
              <p className="text-base md:text-lg font-medium">No labels created</p>
              <p className="text-xs md:text-sm">Create your first label to organize emails</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between gap-2 px-3 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div
                      className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    ></div>
                    <span className="font-medium text-gray-800 text-sm md:text-base truncate">{label.name}</span>
                    <span className="hidden sm:inline text-[10px] md:text-xs text-gray-400 flex-shrink-0">({label.id})</span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete label"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 max-w-md w-full mx-2 md:mx-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-navy">Create New Label</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLabel}>
              <div className="mb-3 md:mb-4">
                <label className="input-label text-sm md:text-base">Label Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field text-sm md:text-base"
                  placeholder="Enter label name"
                  required
                />
              </div>

              <div className="mb-4 md:mb-6">
                <label className="input-label text-sm md:text-base">Color</label>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full transition-all hover:scale-110 ${
                        formData.color === color 
                          ? 'ring-2 ring-offset-2 ring-navy scale-110' 
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Create Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminLabels