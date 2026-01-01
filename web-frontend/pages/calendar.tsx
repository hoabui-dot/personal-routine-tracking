import React from 'react';
import Layout from '../components/Layout';
import GameCalendar from '../components/GameCalendar';
import ProtectedRoute from '../components/ProtectedRoute';
import CapybaraDecoration from '../components/CapybaraDecoration';
import CapybaraFloating from '../components/CapybaraFloating';
import CapybaraBanner from '../components/CapybaraBanner';
import ChatBox from '../components/ChatBox';

const CalendarPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ 
          position: 'relative', 
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {/* Floating Capybara Decorations - Hide on mobile */}
          <div style={{ display: 'none' }} className="capybara-decorations">
            <CapybaraFloating position="top-left" size={80} />
            <CapybaraDecoration />
          </div>
          
          {/* Page Banner */}
          <CapybaraBanner 
            title="Two-Player Daily Goal Game" 
            subtitle="Track your daily sessions and achieve your goals!"
          />
          
          <div style={{ marginTop: 'clamp(1rem, 3vw, 1.5rem)' }}>
            <GameCalendar />
          </div>
        </div>

        {/* Real-time Chat */}
        <ChatBox />
        
        <style jsx>{`
          @media (min-width: 769px) {
            .capybara-decorations {
              display: block !important;
            }
          }
        `}</style>
      </Layout>
    </ProtectedRoute>
  );
};

export default CalendarPage;
