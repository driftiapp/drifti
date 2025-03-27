const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ethers } = require('ethers');
const Event = require('../models/Event');

class EventNFTService {
    constructor() {
        // Initialize Web3 provider
        this.provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
        
        // Load NFT contract ABI and address
        this.nftContract = new ethers.Contract(
            process.env.NFT_CONTRACT_ADDRESS,
            require('../contracts/EventNFT.json').abi,
            this.provider
        );
    }

    async createNFTTicket(eventId, userId, ticketType) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // Create Stripe payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: this.getTicketPrice(ticketType),
                currency: 'usd',
                metadata: {
                    eventId,
                    userId,
                    ticketType
                }
            });

            // Generate unique token ID
            const tokenId = await this.generateUniqueTokenId();

            // Create NFT metadata
            const metadata = {
                name: `${event.title} - ${ticketType} Ticket`,
                description: `VIP access to ${event.title}`,
                image: event.images[0]?.url || '',
                attributes: [
                    {
                        trait_type: 'Event',
                        value: event.title
                    },
                    {
                        trait_type: 'Type',
                        value: ticketType
                    },
                    {
                        trait_type: 'Date',
                        value: new Date(event.startTime).toISOString()
                    }
                ]
            };

            // Store metadata in IPFS (implement your IPFS storage logic)
            const metadataUri = await this.storeMetadataInIPFS(metadata);

            // Mint NFT
            const mintTx = await this.nftContract.mint(
                userId,
                tokenId,
                metadataUri
            );

            await mintTx.wait();

            // Update event with NFT ticket
            await Event.findByIdAndUpdate(eventId, {
                $push: {
                    nftTickets: {
                        tokenId,
                        ownerId: userId,
                        mintedAt: new Date(),
                        ticketType
                    }
                }
            });

            return {
                paymentIntent,
                tokenId,
                metadataUri
            };
        } catch (error) {
            console.error('Error creating NFT ticket:', error);
            throw error;
        }
    }

    async getTicketPrice(ticketType) {
        const prices = {
            'vip': 10000, // $100
            'premium': 5000, // $50
            'standard': 2500 // $25
        };
        return prices[ticketType] || prices.standard;
    }

    async generateUniqueTokenId() {
        // Implement your token ID generation logic
        return Date.now().toString();
    }

    async storeMetadataInIPFS(metadata) {
        // Implement your IPFS storage logic
        // For now, return a placeholder URI
        return `ipfs://${Date.now()}`;
    }

    async verifyNFTOwnership(tokenId, userId) {
        try {
            const owner = await this.nftContract.ownerOf(tokenId);
            return owner.toLowerCase() === userId.toLowerCase();
        } catch (error) {
            console.error('Error verifying NFT ownership:', error);
            return false;
        }
    }

    async getNFTBenefits(tokenId) {
        try {
            const event = await Event.findOne({
                'nftTickets.tokenId': tokenId
            });

            if (!event) {
                throw new Error('Event not found');
            }

            const ticket = event.nftTickets.find(t => t.tokenId === tokenId);

            return {
                eventTitle: event.title,
                ticketType: ticket.ticketType,
                benefits: this.getBenefitsByType(ticket.ticketType)
            };
        } catch (error) {
            console.error('Error getting NFT benefits:', error);
            throw error;
        }
    }

    getBenefitsByType(ticketType) {
        const benefits = {
            'vip': [
                'Priority Entry',
                'Exclusive VIP Area Access',
                'Free Drinks',
                'Meet & Greet with Performers'
            ],
            'premium': [
                'Priority Entry',
                'Reserved Seating',
                'One Free Drink'
            ],
            'standard': [
                'General Admission',
                'Standard Seating'
            ]
        };
        return benefits[ticketType] || benefits.standard;
    }
}

module.exports = new EventNFTService(); 