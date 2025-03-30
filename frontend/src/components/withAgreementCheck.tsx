import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AgreementModal } from './AgreementModal';
import axios from '../utils/axios';

export const withAgreementCheck = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    requiredBusinessType?: string
) => {
    return (props: P) => {
        const { user } = useAuth();
        const navigate = useNavigate();
        const [showAgreement, setShowAgreement] = useState(false);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const verifyAgreements = async () => {
                if (!user) {
                    navigate('/login');
                    return;
                }

                try {
                    const response = await axios.get('/api/agreements/check');
                    const requiredAgreements = response.data.data;
                    if (requiredAgreements.length > 0) {
                        setShowAgreement(true);
                    }
                } catch (error) {
                    console.error('Failed to verify agreements:', error);
                } finally {
                    setLoading(false);
                }
            };

            verifyAgreements();
        }, [user, navigate]);

        const handleAccept = () => {
            setShowAgreement(false);
            setLoading(false);
        };

        if (loading) {
            return <div>Loading...</div>;
        }

        return (
            <>
                <AgreementModal
                    open={showAgreement}
                    onClose={() => navigate(-1)}
                    businessType={requiredBusinessType}
                    onAccept={handleAccept}
                />
                {!showAgreement && <WrappedComponent {...props} />}
            </>
        );
    };
}; 