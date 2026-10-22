// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IsYourDayOkPoints
 * @dev Points system for Mental Health DApp
 * @notice Manages points, streaks, and rewards for users - No registration required
 */
contract IsYourDayOkPoints is Ownable, ReentrancyGuard {
    
    // User data structure
    struct User {
        uint256 totalPoints;
        uint256 journalStreak;
        uint256 meditationStreak;
        uint256 lastJournalDate;
        uint256 lastMeditationDate;
    }

    // Mapping from user address to user data
    mapping(address => User) public users;

    // Point values
    uint256 public constant MOOD_LOG_POINTS = 10;
    uint256 public constant JOURNAL_POINTS = 20;
    uint256 public constant MEDITATION_POINTS = 30;

    // Events
    event PointsAwarded(address indexed user, uint256 points, string activityType);
    event StreakUpdated(address indexed user, string streakType, uint256 newStreak);
    event StreakReset(address indexed user, string streakType);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Award points for mood logging
     * No registration required - automatically creates user data on first action
     */
    function logMood() public {
        users[msg.sender].totalPoints += MOOD_LOG_POINTS;
        
        emit PointsAwarded(msg.sender, MOOD_LOG_POINTS, "mood_log");
    }

    /**
     * @dev Award points for journaling and update streak
     * No registration required - automatically creates user data on first action
     */
    function submitJournal() public {
        User storage user = users[msg.sender];
        uint256 today = block.timestamp / 1 days;
        uint256 lastJournal = user.lastJournalDate / 1 days;

        // Award points
        user.totalPoints += JOURNAL_POINTS;
        
        // Update streak
        if (user.lastJournalDate == 0) {
            // First journal entry
            user.journalStreak = 1;
        } else if (today == lastJournal + 1) {
            // Consecutive day - increment streak
            user.journalStreak++;
        } else if (today > lastJournal + 1) {
            // Missed days - reset streak
            emit StreakReset(msg.sender, "journal");
            user.journalStreak = 1;
        }
        // If same day, don't update streak

        user.lastJournalDate = block.timestamp;

        emit PointsAwarded(msg.sender, JOURNAL_POINTS, "journal");
        emit StreakUpdated(msg.sender, "journal", user.journalStreak);
    }

    /**
     * @dev Award points for meditation and update streak
     * No registration required - automatically creates user data on first action
     */
    function completeMeditation() public {
        User storage user = users[msg.sender];
        uint256 today = block.timestamp / 1 days;
        uint256 lastMeditation = user.lastMeditationDate / 1 days;

        require(today != lastMeditation, "Already meditated today");

        // Award points
        user.totalPoints += MEDITATION_POINTS;
        
        // Update streak
        if (user.lastMeditationDate == 0) {
            // First meditation
            user.meditationStreak = 1;
        } else if (today == lastMeditation + 1) {
            // Consecutive day - increment streak
            user.meditationStreak++;
        } else if (today > lastMeditation + 1) {
            // Missed days - reset streak
            emit StreakReset(msg.sender, "meditation");
            user.meditationStreak = 1;
        }

        user.lastMeditationDate = block.timestamp;

        emit PointsAwarded(msg.sender, MEDITATION_POINTS, "meditation");
        emit StreakUpdated(msg.sender, "meditation", user.meditationStreak);
    }

    /**
     * @dev Get user data
     * Returns default values if user hasn't performed any actions yet
     */
    function getUserData(address userAddress) public view returns (User memory) {
        return users[userAddress];
    }

    /**
     * @dev Check if user can meditate today
     */
    function canMeditateToday(address userAddress) public view returns (bool) {
        uint256 today = block.timestamp / 1 days;
        uint256 lastMeditation = users[userAddress].lastMeditationDate / 1 days;
        return today != lastMeditation;
    }

    /**
     * @dev Get user's journal streak
     */
    function getJournalStreak(address userAddress) public view returns (uint256) {
        return users[userAddress].journalStreak;
    }

    /**
     * @dev Get user's meditation streak
     */
    function getMeditationStreak(address userAddress) public view returns (uint256) {
        return users[userAddress].meditationStreak;
    }

    /**
     * @dev Check if user is eligible for streak NFT
     */
    function isEligibleForNFT(address userAddress, string memory streakType, uint256 requiredDays) 
        public 
        view 
        returns (bool) 
    {
        require(requiredDays == 7 || requiredDays == 30, "Invalid days value");

        if (keccak256(bytes(streakType)) == keccak256(bytes("journal"))) {
            return users[userAddress].journalStreak >= requiredDays;
        } else if (keccak256(bytes(streakType)) == keccak256(bytes("meditation"))) {
            return users[userAddress].meditationStreak >= requiredDays;
        }
        
        return false;
    }

    /**
     * @dev Check if user has any activity (replaces isRegistered)
     */
    function hasActivity(address userAddress) public view returns (bool) {
        User memory user = users[userAddress];
        return user.totalPoints > 0 || user.lastJournalDate > 0 || user.lastMeditationDate > 0;
    }
}
