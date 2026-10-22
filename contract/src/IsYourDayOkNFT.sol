// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IsYourDayOkNFT
 * @dev NFT contract for minting mental health achievement NFTs
 * Supports 4 types of achievements based on streaks
 * No registration required - users can mint based on their streak achievements
 */
contract IsYourDayOkNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // Achievement types
    enum AchievementType {
        JOURNAL_7_DAY,
        JOURNAL_30_DAY,
        MEDITATION_7_DAY,
        MEDITATION_30_DAY
    }

    // NFT Achievement data
    struct Achievement {
        AchievementType achievementType;
        uint256 timestamp;
        uint256 improvementRating; // 1-100
        address recipient;
    }

    // Mapping from token ID to achievement data
    mapping(uint256 => Achievement) public achievements;

    // Mapping to track if user has minted specific achievement
    mapping(address => mapping(AchievementType => bool)) public hasMinted;

    // Events
    event AchievementMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        AchievementType achievementType,
        uint256 improvementRating
    );

    constructor() ERC721("Is Your Day Ok Mental Health Achievement", "ISYDO-MHA") Ownable(msg.sender) {}

    /**
     * @dev Mint a new achievement NFT
     * Can only be called by contract owner (backend server)
     * No registration check needed - if user earned the achievement, they can mint
     */
    function mintAchievement(
        address to,
        AchievementType achievementType,
        uint256 improvementRating,
        string memory uri
    ) public onlyOwner returns (uint256) {
        require(improvementRating > 0 && improvementRating <= 100, "Invalid rating");
        require(!hasMinted[to][achievementType], "Achievement already minted");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        achievements[tokenId] = Achievement({
            achievementType: achievementType,
            timestamp: block.timestamp,
            improvementRating: improvementRating,
            recipient: to
        });

        hasMinted[to][achievementType] = true;

        emit AchievementMinted(tokenId, to, achievementType, improvementRating);

        return tokenId;
    }

    /**
     * @dev Get achievement details for a token
     */
    function getAchievement(uint256 tokenId) public view returns (Achievement memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return achievements[tokenId];
    }

    /**
     * @dev Check if user has minted specific achievement
     */
    function hasUserMinted(address user, AchievementType achievementType) public view returns (bool) {
        return hasMinted[user][achievementType];
    }

    /**
     * @dev Get total number of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Get all achievement types a user has minted
     */
    function getUserAchievements(address user) public view returns (bool[4] memory) {
        return [
            hasMinted[user][AchievementType.JOURNAL_7_DAY],
            hasMinted[user][AchievementType.JOURNAL_30_DAY],
            hasMinted[user][AchievementType.MEDITATION_7_DAY],
            hasMinted[user][AchievementType.MEDITATION_30_DAY]
        ];
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
