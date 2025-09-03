import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../src/SingleEventDetailPage.css';

// SVG Icon imports
import ClockIcon from '../icons/clock.svg';
import LocationIcon from '../icons/location.svg';
import StarIcon from '../icons/star.svg';
import RateIcon from '../icons/rate.svg';
import ArrowLeftIcon from '../icons/arrow-left.svg';

const API_BASE_URL =
    typeof __backend_url !== 'undefined' ? __backend_url : 'http://localhost:3000';

export default function SingleEventDetailPage() {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const { id } = useParams();
    const eventId = parseInt(id, 10);

    useEffect(() => {
        const fetchEventDetails = async () => {
            if (isNaN(eventId)) {
                setError('Invalid event ID.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
                if (!response.ok) {
                    throw new Error(`HTTP status: ${response.status}`);
                }
                const data = await response.json();
                setEvent(data);
            } catch (err) {
                console.error('Failed to fetch event details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    useEffect(() => {
        const fetchEventStatus = async () => {
            if (isNaN(eventId)) return;

            try {
                const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/status`);
                if (!response.ok) {
                    throw new Error(`HTTP status: ${response.status}`);
                }
                const data = await response.json();
                setStatus(data.status);
            } catch (err) {
                console.error('Failed to fetch event status:', err);
            }
        };

        if (event) {
            fetchEventStatus();
        }
    }, [eventId, event]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    const goToNextImage = () => {
        if (event.event_photos && event.event_photos.length > 1) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === event.event_photos.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const goToPrevImage = () => {
        if (event.event_photos && event.event_photos.length > 1) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === 0 ? event.event_photos.length - 1 : prevIndex - 1
            );
        }
    };

    const goToImage = (index) => {
        setCurrentImageIndex(index);
    };

    const toggleDescription = () => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-text">
                    Error: Failed to fetch event. Please check the backend server.
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="not-found-container">
                <div className="not-found-text">Event not found.</div>
            </div>
        );
    }

    const startDate = formatDate(event.start_time);
    const endDate = formatDate(event.end_time);
    const dateRange =
        startDate && endDate
            ? `${startDate} - ${endDate}`
            : startDate || endDate || 'N/A';

    return (
        <div className="event-detail-container">
            {/* Mobile Navigation Bar */}
            <div className="mobile-nav-bar">
                <a href="/" className="mobile-back-button">
                    <img src={ArrowLeftIcon} alt="Back" className="mobile-back-icon" />
                </a>
                <h2 className="mobile-nav-title">Details</h2>
                <div className="mobile-nav-spacer"></div>
            </div>

            <div className="event-content">
                {/* Left section */}
                <div className="event-left-section">
                    <a href="/" className="back-button">
                        <img src={ArrowLeftIcon} alt="Back" className="back-icon" />
                        Back
                    </a>

                    <div className="event-header">
                        <div className="event-title-row">
                            <h1 className="event-title">{event.event_title}</h1>
                            {status && (
                                <span className={`event-status ${status.toLowerCase()}`}>
                  {status}
                </span>
                            )}
                        </div>
                        <div className="event-description-container">
                            <p
                                className={`event-description ${
                                    isDescriptionExpanded ? 'expanded' : ''
                                }`}
                            >
                                {event.description}
                            </p>
                            <button
                                className="description-toggle"
                                onClick={toggleDescription}
                            >
                                {isDescriptionExpanded ? 'Less' : 'More'}
                            </button>
                        </div>
                    </div>

                    <div className="event-details">
                        <div className="detail-item">
                            <img src={ClockIcon} alt="Time" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">{dateRange}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <img src={LocationIcon} alt="Location" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">{event.location}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <img src={StarIcon} alt="Interested" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">
                                    {event.interested_count} People Interested
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ Updated Rate event button */}
                    <Link to={`/events/${eventId}/feedback`} className="rate-button">
                        <img src={RateIcon} alt="Rate" className="rate-icon" />
                        Rate Event
                    </Link>
                </div>

                {/* Right section with carousel */}
                {event.event_photos && event.event_photos.length > 0 ? (
                    <div className="photo-carousel">
                        <div
                            className={`carousel-container ${
                                event.event_photos.length === 1 ? 'single-image' : ''
                            }`}
                        >
                            <div
                                className="carousel-track"
                                style={{
                                    transform: `translateX(-${currentImageIndex * 100}%)`,
                                }}
                            >
                                {event.event_photos.map((photo, index) => (
                                    <div key={index} className="carousel-slide">
                                        <img
                                            src={photo.photo_url}
                                            alt={`Event Photo ${index + 1}`}
                                            className="carousel-image"
                                        />
                                    </div>
                                ))}
                            </div>

                            {event.event_photos.length > 1 && (
                                <>
                                    <button
                                        className="carousel-navigation carousel-prev"
                                        onClick={goToPrevImage}
                                        aria-label="Previous image"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="carousel-navigation carousel-next"
                                        onClick={goToNextImage}
                                        aria-label="Next image"
                                    >
                                        ›
                                    </button>
                                </>
                            )}

                            {event.event_photos.length > 1 && (
                                <div className="carousel-dots">
                                    {event.event_photos.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`carousel-dot ${
                                                index === currentImageIndex ? 'active' : ''
                                            }`}
                                            onClick={() => goToImage(index)}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-image-placeholder">No Image Found</div>
                )}
            </div>
        </div>
    );
}
