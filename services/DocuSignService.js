const docusign = require('docusign-esign');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

class DocuSignService {
    constructor(config) {
        this.config = config;
        this.apiClient = new docusign.ApiClient();
        this.apiClient.setBasePath(config.basePath);
        this.accountId = config.accountId;
        this.contractManager = config.contractManager;
    }

    /**
     * Initialize DocuSign API client with JWT authentication
     */
    async authenticate() {
        try {
            const privateKeyFile = fs.readFileSync(this.config.privateKeyPath);
            const token = await this.apiClient.requestJWTUserToken(
                this.config.integrationKey,
                this.config.userId,
                this.config.scopes,
                privateKeyFile,
                3600
            );
            this.apiClient.addDefaultHeader('Authorization', 'Bearer ' + token.body.access_token);
            return token;
        } catch (error) {
            console.error('DocuSign authentication failed:', error);
            throw error;
        }
    }

    /**
     * Create and send a contract envelope for signature
     */
    async createContractEnvelope(contractData) {
        try {
            const envelopeDefinition = new docusign.EnvelopeDefinition();
            const { contractType, party, documents, signers } = contractData;

            // Create document objects
            const docs = documents.map((doc, index) => {
                return new docusign.Document()
                    .setDocumentBase64(doc.content)
                    .setName(doc.name)
                    .setFileExtension(doc.extension)
                    .setDocumentId((index + 1).toString());
            });

            // Create signer objects with tabs
            const signerList = signers.map((signer, index) => {
                const tabs = this._createSignerTabs(signer.tabPositions);
                return new docusign.Signer()
                    .setEmail(signer.email)
                    .setName(signer.name)
                    .setRecipientId((index + 1).toString())
                    .setRoutingOrder((index + 1).toString())
                    .setTabs(tabs);
            });

            // Set up the envelope
            envelopeDefinition.setDocuments(docs)
                .setRecipients(new docusign.Recipients().setSigners(signerList))
                .setStatus('sent')
                .setCustomFields(new docusign.CustomFields({
                    textCustomFields: [
                        new docusign.TextCustomField()
                            .setName('contractType')
                            .setValue(contractType),
                        new docusign.TextCustomField()
                            .setName('partyAddress')
                            .setValue(party)
                    ]
                }));

            // Create and send the envelope
            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            const envelope = await envelopesApi.createEnvelope(this.accountId, {
                envelopeDefinition
            });

            // Store envelope ID in blockchain
            const documentHash = ethers.utils.id(envelope.envelopeId);
            await this._createBlockchainContract(party, contractType, documentHash);

            return {
                envelopeId: envelope.envelopeId,
                status: envelope.status,
                documentHash
            };
        } catch (error) {
            console.error('Failed to create contract envelope:', error);
            throw error;
        }
    }

    /**
     * Create blockchain contract record
     */
    async _createBlockchainContract(party, contractType, documentHash) {
        try {
            const duration = contractType === 'STORE_OWNER' ? 365 * 24 * 60 * 60 : 180 * 24 * 60 * 60;
            const tx = await this.contractManager.createContract(
                party,
                contractType,
                duration,
                documentHash
            );
            await tx.wait();
            return tx;
        } catch (error) {
            console.error('Failed to create blockchain contract:', error);
            throw error;
        }
    }

    /**
     * Create tabs for document signing
     */
    _createSignerTabs(tabPositions) {
        const signHereTabs = tabPositions.map(pos => {
            return new docusign.SignHere()
                .setDocumentId(pos.documentId)
                .setPageNumber(pos.pageNumber)
                .setXPosition(pos.x)
                .setYPosition(pos.y);
        });

        return new docusign.Tabs().setSignHereTabs(signHereTabs);
    }

    /**
     * Get envelope status and update blockchain if signed
     */
    async checkEnvelopeStatus(envelopeId, contractId) {
        try {
            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            const status = await envelopesApi.getEnvelope(this.accountId, envelopeId);

            if (status.status === 'completed') {
                // Activate contract in blockchain
                await this.contractManager.activateContract(contractId);
                
                // Get signed documents
                const documents = await envelopesApi.listDocuments(this.accountId, envelopeId);
                
                // Store documents in secure storage
                await this._storeSignedDocuments(envelopeId, documents);
            }

            return status;
        } catch (error) {
            console.error('Failed to check envelope status:', error);
            throw error;
        }
    }

    /**
     * Store signed documents securely
     */
    async _storeSignedDocuments(envelopeId, documents) {
        try {
            const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
            
            for (const doc of documents.envelopeDocuments) {
                const documentBytes = await envelopesApi.getDocument(
                    this.accountId,
                    envelopeId,
                    doc.documentId
                );

                // Store in secure location (implement your storage logic here)
                const storagePath = path.join(
                    this.config.documentsPath,
                    envelopeId,
                    `${doc.name}.pdf`
                );
                
                await fs.promises.mkdir(path.dirname(storagePath), { recursive: true });
                await fs.promises.writeFile(storagePath, documentBytes);
            }
        } catch (error) {
            console.error('Failed to store signed documents:', error);
            throw error;
        }
    }

    /**
     * Create webhook for envelope status updates
     */
    async createStatusWebhook(envelopeId) {
        try {
            const webhooksApi = new docusign.ConnectApi(this.apiClient);
            const webhook = new docusign.ConnectEventData()
                .setEnvelopeEvents([
                    { envelopeEventStatusCode: 'completed' },
                    { envelopeEventStatusCode: 'declined' },
                    { envelopeEventStatusCode: 'voided' }
                ])
                .setUrlToPublishTo(this.config.webhookUrl)
                .setAllowEnvelopePublish('true')
                .setIncludeDocuments('true')
                .setRequireAcknowledgment('true');

            await webhooksApi.createEventNotification(this.accountId, envelopeId, { connectEventData: webhook });
        } catch (error) {
            console.error('Failed to create webhook:', error);
            throw error;
        }
    }
}

module.exports = DocuSignService; 