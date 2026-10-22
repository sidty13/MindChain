# Admin Interface Setup

## Overview

The admin interface (`/admin`) allows authorized wallet addresses to send messages to all users in the community chat room. This is a powerful tool for communicating updates, milestones, and important announcements.

## Setup Instructions

### 1. Configure Admin Addresses

Open `/frontend/src/app/admin/page.tsx` and update the `ADMIN_ADDRESSES` array with your admin wallet addresses:

```typescript
const ADMIN_ADDRESSES = [
  '0xYourAdminAddressHere', // Replace with actual admin address
  '0xAnotherAdminAddress',  // Add more as needed
];
```

**Important:** 
- Add all wallet addresses in lowercase or ensure case-insensitive comparison
- Keep this list private and secure
- Only add trusted addresses

### 2. Access the Admin Panel

1. Navigate to: `https://your-domain.com/admin`
2. Connect your wallet
3. If your address is in the `ADMIN_ADDRESSES` list, you'll see the admin dashboard

### 3. Message Types

The admin interface supports three message types:

#### 👨‍💼 Admin
- Official announcements from the team
- System updates
- Policy changes
- General communications

**Example:**
```
Welcome to IsYourDayOk! We're excited to have you join our mental health journey on Base. 🎉
```

#### 🎉 Milestone
- Community achievements
- Platform milestones
- Special celebrations

**Example:**
```
🎊 We just hit 10,000 mood logs! Thank you for being part of this amazing journey! 
```

#### 🤖 System
- Technical updates
- Maintenance notifications
- Feature launches

**Example:**
```
New feature launched: NFT achievements are now available! Complete 7-day streaks to mint your first NFT.
```

## Features

### Send Messages
1. Select message type (Admin, Milestone, or System)
2. Enter your message content
3. Click "Send Message"
4. Message appears immediately in the community chat room

### View Recent Messages
- See all recent messages with timestamps
- Messages are color-coded by type
- Real-time updates every 10 seconds

### Delete Messages
- Click "Delete" on any admin/system/milestone message
- Confirmation dialog prevents accidental deletions
- User-generated messages (mood, achievement) cannot be deleted

### Statistics
- Track admin posts, milestones, and total messages
- Monitor community engagement

## Security Considerations

### Access Control
- Only wallet addresses in `ADMIN_ADDRESSES` can access the interface
- Non-admin wallets see an "Access Denied" page
- No backend authentication - relies on wallet connection

### Best Practices
1. **Keep Admin Addresses Private**: Don't share the admin wallet addresses publicly
2. **Use Hardware Wallets**: Protect admin wallets with hardware wallet security
3. **Audit Messages**: Regularly review sent messages for accuracy
4. **Backup Admin Access**: Have multiple admin addresses in case one is compromised
5. **Message Carefully**: Remember all users see your messages immediately

### Enhanced Security (Optional)

For production deployments, consider:

1. **Backend Authentication**
   ```typescript
   // Add server-side verification in API route
   const isAdmin = await verifyAdminSignature(walletAddress, signature);
   ```

2. **Rate Limiting**
   ```typescript
   // Limit message frequency per admin
   const canPost = await checkRateLimit(walletAddress);
   ```

3. **Message Approval**
   ```typescript
   // Require multiple admin approvals for sensitive messages
   const approved = await getApprovalCount(messageId) >= 2;
   ```

4. **Audit Log**
   ```typescript
   // Track all admin actions
   await logAdminAction(walletAddress, 'MESSAGE_SENT', messageId);
   ```

## Message Guidelines

### Do's ✅
- Keep messages positive and supportive
- Use clear, concise language
- Include relevant emojis for visual appeal
- Announce important updates promptly
- Celebrate community achievements

### Don'ts ❌
- Don't send spam or promotional content
- Don't share sensitive user information
- Don't use harsh or negative language
- Don't overuse the admin channel
- Don't send messages during off-hours (unless urgent)

## Troubleshooting

### "Access Denied" Error
- **Cause**: Your wallet address is not in the `ADMIN_ADDRESSES` array
- **Solution**: Add your address to the array and redeploy

### Messages Not Appearing
- **Cause**: API route error or database connection issue
- **Solution**: Check console logs and verify database connection

### Delete Not Working
- **Cause**: User-generated messages cannot be deleted
- **Solution**: Only admin/system/milestone messages can be deleted

### Wallet Not Connecting
- **Cause**: Browser wallet extension issue
- **Solution**: Refresh page, check wallet connection

## API Reference

### POST `/api/chat`
Create a new message:
```typescript
{
  type: 'admin' | 'system' | 'milestone',
  content: string,
  userId?: string  // Optional, usually null for admin messages
}
```

### GET `/api/chat?limit=50`
Fetch recent messages:
```typescript
Response: ChatMessage[]
```

### DELETE `/api/chat`
Delete a message:
```typescript
{
  messageId: string
}
```

## Development

### Local Testing
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000/admin`
3. Update `ADMIN_ADDRESSES` with your test wallet
4. Connect and test messaging

### Database Schema
```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  type      String   // 'admin', 'system', 'milestone', 'mood', 'achievement'
  content   String   @db.Text
  userId    String?
  createdAt DateTime @default(now())
  
  user      User?    @relation(fields: [userId], references: [id])
}
```

## Deployment Checklist

- [ ] Update `ADMIN_ADDRESSES` with production wallet addresses
- [ ] Test message sending in development
- [ ] Test message deletion
- [ ] Verify access control (non-admin cannot access)
- [ ] Test on mobile devices
- [ ] Backup admin wallet seed phrases securely
- [ ] Document admin procedures for team
- [ ] Set up monitoring/alerts for admin actions
- [ ] Test all message types (admin, milestone, system)

## Support

For technical issues or questions:
- Check console logs for error messages
- Review database connections
- Verify wallet connection status
- Contact development team

---

**Remember:** With great power comes great responsibility. Use the admin interface wisely to foster a positive and supportive community. 💙
