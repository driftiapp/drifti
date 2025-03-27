// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title DriftiContractManager
 * @dev Manages contracts and document verification for Drifti platform
 */
contract DriftiContractManager is AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Contract {
        address party;
        string contractType;  // "STORE_OWNER" or "DRIVER"
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        bytes32 documentHash;
        mapping(string => Document) documents;
    }

    struct Document {
        string docType;  // "BUSINESS_LICENSE", "DRIVERS_LICENSE", "INSURANCE"
        bytes32 hash;
        uint256 expiresAt;
        bool isVerified;
    }

    mapping(bytes32 => Contract) public contracts;
    mapping(address => bytes32[]) public partyContracts;
    
    event ContractCreated(bytes32 indexed contractId, address indexed party, string contractType);
    event DocumentVerified(bytes32 indexed contractId, string docType, uint256 expiresAt);
    event ContractActivated(bytes32 indexed contractId);
    event ContractDeactivated(bytes32 indexed contractId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Creates a new contract for a party
     */
    function createContract(
        address party,
        string memory contractType,
        uint256 duration,
        bytes32 documentHash
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (bytes32) {
        bytes32 contractId = keccak256(abi.encodePacked(party, contractType, block.timestamp));
        
        Contract storage newContract = contracts[contractId];
        newContract.party = party;
        newContract.contractType = contractType;
        newContract.createdAt = block.timestamp;
        newContract.expiresAt = block.timestamp + duration;
        newContract.documentHash = documentHash;
        
        partyContracts[party].push(contractId);
        
        emit ContractCreated(contractId, party, contractType);
        return contractId;
    }

    /**
     * @dev Adds or updates a verified document
     */
    function verifyDocument(
        bytes32 contractId,
        string memory docType,
        bytes32 hash,
        uint256 expiresAt
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(contracts[contractId].party != address(0), "Contract does not exist");
        
        Document storage doc = contracts[contractId].documents[docType];
        doc.docType = docType;
        doc.hash = hash;
        doc.expiresAt = expiresAt;
        doc.isVerified = true;
        
        emit DocumentVerified(contractId, docType, expiresAt);
    }

    /**
     * @dev Activates a contract after all required documents are verified
     */
    function activateContract(bytes32 contractId) external onlyRole(ADMIN_ROLE) whenNotPaused {
        Contract storage contract_ = contracts[contractId];
        require(contract_.party != address(0), "Contract does not exist");
        require(!contract_.isActive, "Contract already active");
        
        // Verify required documents based on contract type
        if (keccak256(abi.encodePacked(contract_.contractType)) == keccak256(abi.encodePacked("STORE_OWNER"))) {
            require(
                contracts[contractId].documents["BUSINESS_LICENSE"].isVerified &&
                contracts[contractId].documents["INSURANCE"].isVerified,
                "Missing required documents"
            );
        } else if (keccak256(abi.encodePacked(contract_.contractType)) == keccak256(abi.encodePacked("DRIVER"))) {
            require(
                contracts[contractId].documents["DRIVERS_LICENSE"].isVerified &&
                contracts[contractId].documents["INSURANCE"].isVerified &&
                contracts[contractId].documents["VEHICLE_REGISTRATION"].isVerified,
                "Missing required documents"
            );
        }
        
        contract_.isActive = true;
        emit ContractActivated(contractId);
    }

    /**
     * @dev Deactivates an expired or violated contract
     */
    function deactivateContract(bytes32 contractId) external onlyRole(ADMIN_ROLE) {
        Contract storage contract_ = contracts[contractId];
        require(contract_.party != address(0), "Contract does not exist");
        require(contract_.isActive, "Contract not active");
        
        contract_.isActive = false;
        emit ContractDeactivated(contractId);
    }

    /**
     * @dev Checks if a contract is valid and active
     */
    function isContractValid(bytes32 contractId) external view returns (bool) {
        Contract storage contract_ = contracts[contractId];
        return contract_.isActive &&
               block.timestamp < contract_.expiresAt &&
               contract_.party != address(0);
    }

    /**
     * @dev Gets all contract IDs for a party
     */
    function getPartyContracts(address party) external view returns (bytes32[] memory) {
        return partyContracts[party];
    }

    /**
     * @dev Pauses all contract operations
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all contract operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 