import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { chatAPI } from '../../api/chat'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiUsers, FiUser, FiCalendar } from 'react-icons/fi'

const EmployeeGroupInfo = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupInfo()
  }, [groupId])

  const fetchGroupInfo = async () => {
    try {
      const response = await chatAPI.getGroup(groupId)
      setGroup(response)
    } catch (error) {
      console.error('Error fetching group info:', error)
      toast.error('Failed to load group info')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="max-w-3xl mx-auto px-2 sm:px-0">
        <button
          onClick={() => navigate(`/employee/chat/group/${groupId}`)}
          className="flex items-center text-gray-600 hover:text-navy mb-4 md:mb-6 text-sm md:text-base"
        >
          <FiArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Back to Chat
        </button>

        <div className="bg-white rounded-xl shadow-card p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0 self-start sm:self-auto">
              <FiUsers className="w-6 h-6 md:w-8 md:h-8 text-navy" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-navy">{group?.name}</h2>
              {group?.description && (
                <p className="text-gray-500 text-sm md:text-base mt-0.5 md:mt-1 break-words">{group.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-500">
                <FiUsers className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Members</span>
              </div>
              <p className="text-lg md:text-xl font-semibold text-navy mt-0.5 md:mt-1">{group?.member_count || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-500">
                <FiCalendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Created</span>
              </div>
              <p className="text-lg md:text-xl font-semibold text-navy mt-0.5 md:mt-1">
                {group?.created_at ? new Date(group.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Members</h3>
            <div className="divide-y divide-gray-100">
              {group?.members?.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-navy font-semibold text-xs md:text-sm">{member.full_name?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-navy text-sm md:text-base truncate">{member.full_name}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>
                  {member.is_admin && (
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0 self-start sm:self-auto">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeGroupInfo