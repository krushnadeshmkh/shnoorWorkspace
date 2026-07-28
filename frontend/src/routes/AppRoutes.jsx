import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'

import Login from '../pages/Login'
import Register from '../pages/Register'

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminGroups = lazy(() => import('../pages/admin/AdminGroups'))
const AdminGroupDetails = lazy(() => import('../pages/admin/AdminGroupDetails'))
const AdminEmailLogs = lazy(() => import('../pages/admin/AdminEmailLogs'))
const AdminChatLogs = lazy(() => import('../pages/admin/AdminChatLogs'))
const AdminActivityLogs = lazy(() => import('../pages/admin/AdminActivityLogs'))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'))

const AdminInbox = lazy(() => import('../pages/admin/AdminInbox'))
const AdminCompose = lazy(() => import('../pages/admin/AdminCompose'))
const AdminEmailView = lazy(() => import('../pages/admin/AdminEmailView'))
const AdminSent = lazy(() => import('../pages/admin/AdminSent'))
const AdminDrafts = lazy(() => import('../pages/admin/AdminDrafts'))
const AdminArchive = lazy(() => import('../pages/admin/AdminArchive'))
const AdminSpam = lazy(() => import('../pages/admin/AdminSpam'))
const AdminTrash = lazy(() => import('../pages/admin/AdminTrash'))
const AdminImportant = lazy(() => import('../pages/admin/AdminImportant'))
const AdminStarred = lazy(() => import('../pages/admin/AdminStarred'))
const AdminLabels = lazy(() => import('../pages/admin/AdminLabels'))
const AdminLabelEmails = lazy(() => import('../pages/admin/AdminLabelEmails'))

const AdminChat = lazy(() => import('../pages/admin/AdminChat'))
const AdminGroupChat = lazy(() => import('../pages/admin/AdminGroupChat'))
const AdminPrivateChat = lazy(() => import('../pages/admin/AdminPrivateChat'))
const AdminCreateGroup = lazy(() => import('../pages/admin/AdminCreateGroup'))

const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard'))
const EmployeeInbox = lazy(() => import('../pages/employee/EmployeeInbox'))
const EmployeeCompose = lazy(() => import('../pages/employee/EmployeeCompose'))
const EmployeeEmailView = lazy(() => import('../pages/employee/EmployeeEmailView'))
const EmployeeSent = lazy(() => import('../pages/employee/EmployeeSent'))
const EmployeeDrafts = lazy(() => import('../pages/employee/EmployeeDrafts'))
const EmployeeArchive = lazy(() => import('../pages/employee/EmployeeArchive'))
const EmployeeSpam = lazy(() => import('../pages/employee/EmployeeSpam'))
const EmployeeTrash = lazy(() => import('../pages/employee/EmployeeTrash'))
const EmployeeImportant = lazy(() => import('../pages/employee/EmployeeImportant'))
const EmployeeStarred = lazy(() => import('../pages/employee/EmployeeStarred'))
const EmployeeLabels = lazy(() => import('../pages/employee/EmployeeLabels'))
const EmployeeLabelEmails = lazy(() => import('../pages/employee/EmployeeLabelEmails'))
const EmployeeChat = lazy(() => import('../pages/employee/EmployeeChat'))
const EmployeeGroupChat = lazy(() => import('../pages/employee/EmployeeGroupChat'))
const EmployeePrivateChat = lazy(() => import('../pages/employee/EmployeePrivateChat'))
const EmployeeCreateGroup = lazy(() => import('../pages/employee/EmployeeCreateGroup'))

const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))

const RouteFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh]" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
    <span className="sr-only">Loading page</span>
  </div>
)

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
          <Route path="/admin/groups/:groupId" element={<AdminGroupDetails />} />
          <Route path="/admin/emails" element={<AdminEmailLogs />} />
          <Route path="/admin/chat-monitor" element={<AdminChatLogs />} />
          <Route path="/admin/activity" element={<AdminActivityLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          <Route path="/admin/inbox" element={<AdminInbox />} />
          <Route path="/admin/compose" element={<AdminCompose />} />
          <Route path="/admin/compose/:replyTo" element={<AdminCompose />} />
          <Route path="/admin/email/:emailId" element={<AdminEmailView />} />
          <Route path="/admin/sent" element={<AdminSent />} />
          <Route path="/admin/drafts" element={<AdminDrafts />} />
          <Route path="/admin/archive" element={<AdminArchive />} />
          <Route path="/admin/spam" element={<AdminSpam />} />
          <Route path="/admin/trash" element={<AdminTrash />} />
          <Route path="/admin/important" element={<AdminImportant />} />
          <Route path="/admin/starred" element={<AdminStarred />} />
          <Route path="/admin/labels" element={<AdminLabels />} />
          <Route path="/admin/labels/:labelId" element={<AdminLabelEmails />} />

          <Route path="/admin/chat" element={<AdminChat />} />
          <Route path="/admin/chat/group/:groupId" element={<AdminGroupChat />} />
          <Route path="/admin/chat/private/:userId" element={<AdminPrivateChat />} />
          <Route path="/admin/chat/create-group" element={<AdminCreateGroup />} />

          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/inbox" element={<EmployeeInbox />} />
          <Route path="/employee/compose" element={<EmployeeCompose />} />
          <Route path="/employee/compose/:replyTo" element={<EmployeeCompose />} />
          <Route path="/employee/email/:emailId" element={<EmployeeEmailView />} />
          <Route path="/employee/sent" element={<EmployeeSent />} />
          <Route path="/employee/drafts" element={<EmployeeDrafts />} />
          <Route path="/employee/archive" element={<EmployeeArchive />} />
          <Route path="/employee/spam" element={<EmployeeSpam />} />
          <Route path="/employee/trash" element={<EmployeeTrash />} />
          <Route path="/employee/important" element={<EmployeeImportant />} />
          <Route path="/employee/starred" element={<EmployeeStarred />} />
          <Route path="/employee/labels" element={<EmployeeLabels />} />
          <Route path="/employee/labels/:labelId" element={<EmployeeLabelEmails />} />
          <Route path="/employee/chat" element={<EmployeeChat />} />
          <Route path="/employee/chat/group/:groupId" element={<EmployeeGroupChat />} />
          <Route path="/employee/chat/private/:userId" element={<EmployeePrivateChat />} />
          <Route path="/employee/chat/create-group" element={<EmployeeCreateGroup />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes