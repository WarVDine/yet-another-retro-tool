import { GuestUserModal } from '@/components/GuestUserModal'

export function CreateUserScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="relative">
          {/* Force the modal to be open and non-dismissible */}
          <GuestUserModal />
        </div>
      </div>
    </div>
  )
}