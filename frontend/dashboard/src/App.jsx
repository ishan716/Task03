// App.jsx
import { Routes, Route } from 'react-router-dom';
import SingleEventDetailPage from '../pages/SingleEventDetailPage.jsx';
import EventsScreen from './EventsScreen';
import FeedbackPage from '../pages/FeedbackPage.jsx';
import './App.css';

function Home() {
    return (
        <div className="home-container p-6">
            <EventsScreen />
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            {/* Home route with list of events */}
            <Route path="/" element={<Home />} />

            {/* Single event details */}
            <Route path="/events/:id" element={<SingleEventDetailPage />} />

            {/* Feedback page for event */}
            <Route path="/events/:eventId/feedback" element={<FeedbackPage />} />
        </Routes>
    );
}
