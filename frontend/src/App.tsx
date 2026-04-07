import { Routes, Route } from 'react-router-dom'

import { GuestUserProvider } from '@/contexts/GuestUserContext'
import { ModalProvider } from '@/contexts/ModalContext'
import { GuestUserModal } from '@/components/GuestUserModal'
import { Header } from '@/components/Header'
import { CreateRetroPage } from '@/pages/CreateRetroPage'
import { HomePage } from '@/pages/HomePage'
import { RetroPage } from '@/pages/RetroPage'
import './App.css'

function AppContent() {
  return (
    <div className='App'>
      <Header />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/create' element={<CreateRetroPage />} />
        <Route path='/retro/:id' element={<RetroPage />} />
      </Routes>
      
      {/* Single modal that handles both create and edit modes */}
      <GuestUserModal />
    </div>
  )
}

export function App() {
  return (
    <GuestUserProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </GuestUserProvider>
  )
}
