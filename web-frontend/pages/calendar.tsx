import React from 'react';
import Layout from '../components/Layout';
import GameCalendar from '../components/GameCalendar';
import ProtectedRoute from '../components/ProtectedRoute';
import CapybaraDecoration from '../components/CapybaraDecoration';
import CapybaraFloating from '../components/CapybaraFloating';
import CapybaraBanner from '../components/CapybaraBanner';

const CalendarPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ position: 'relative', paddingTop: '1rem' }}>
          {/* Floating Capybara Decorations */}
          <CapybaraFloating position="top-left" size={80} />
          <CapybaraDecoration />
          
          {/* Page Banner */}
          <CapybaraBanner 
            title="Two-Player Daily Goal Game" 
            subtitle="Track your daily sessions and achieve your goals!"
          />
          
          <div style={{ marginTop: '1.5rem' }}>
            <GameCalendar />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default CalendarPage;
