# Comment System and Admin Review

## Overview

The comment system enables interactive discussions between students and instructors on course content. It features a comprehensive admin review workflow that allows administrators to moderate content, respond to student queries, and maintain high-quality educational discourse.

## Core Features

### Student Comment Capabilities
- **Create Comments**: Post questions, insights, and feedback on course segments
- **Threaded Discussions**: Reply to comments creating organized conversation threads
- **Edit & Delete**: Modify or remove your own comments
- **Real-time Updates**: See new comments and replies instantly
- **@Mentions**: Reference other users in replies for better context

### Admin Review & Moderation
- **Central Dashboard**: Unified interface for managing all platform comments
- **Filter & Search**: Find comments by status, user, or content
- **Bulk Actions**: Efficiently moderate multiple comments
- **Official Responses**: Post admin replies with special visual indicators
- **Content Moderation**: Delete inappropriate or spam content
- **Status Tracking**: Monitor which comments have been addressed

### Technical Implementation
- Built with TanStack Start, React Query, and PostgreSQL
- Real-time state management with optimistic UI updates
- Secure server-side validation and authorization
- Responsive design for desktop and mobile access

## System Architecture

### Database Schema
```sql
comments (
  id: serial primary key,
  userId: foreign key -> users.id,
  segmentId: foreign key -> segments.id,
  parentId: foreign key -> comments.id (for threading),
  repliedToId: foreign key -> users.id (for @mentions),
  content: text,
  createdAt: timestamp,
  updatedAt: timestamp
)
```

### Key Components
- **CommentForm**: Interactive comment creation interface
- **CommentList**: Threaded comment display with real-time updates
- **CommentsPanel**: Main container orchestrating comment functionality
- **AdminComments**: Administrative dashboard for comment moderation

### Server Functions
- `getCommentsFn`: Retrieve comments for a specific segment
- `createCommentFn`: Create new comments with validation
- `updateCommentFn`: Edit existing comments
- `deleteCommentFn`: Delete user's own comments
- `getAllRecentCommentsFn`: Admin function to retrieve all comments
- `deleteCommentAsAdminFn`: Admin function to delete any comment

## Testing

### Manual Testing Routes

#### Student Comment Flow
1. **Navigate to Course Content**
   ```
   URL: /learn/[segment-slug]
   Tab: Comments
   ```

2. **Test Comment Creation**
   - Verify login requirement for commenting
   - Test character limits (3 minimum, 5000 maximum)
   - Check auto-resize textarea functionality
   - Verify Enter to submit, Shift+Enter for new line

3. **Test Comment Threading**
   - Reply to existing comments
   - Verify threaded display with proper visual hierarchy
   - Test @mention functionality in replies

4. **Test Comment Management**
   - Edit your own comments using dropdown menu
   - Delete your own comments with confirmation dialog
   - Verify real-time updates when others comment

#### Admin Review Flow
1. **Access Admin Dashboard**
   ```
   URL: /admin/comments
   Requirements: Admin user authentication
   ```

2. **Test Comment Moderation**
   - View all comments across platform
   - Toggle "Hide Addressed" filter to see pending comments
   - Test admin reply functionality
   - Verify visual indicators for addressed comments

3. **Test Admin Actions**
   - Delete any comment using admin privileges
   - Verify cascade deletion warnings for threaded comments
   - Test bulk moderation capabilities
   - Check admin response tracking

### Test Data Setup

#### Create Test Comments
```bash
# Ensure you have test users and course segments
npm run db:seed

# Navigate to any course segment as a regular user
# Post several test comments and replies
```

#### Admin User Setup
```sql
-- Promote a user to admin status
UPDATE app_user SET "isAdmin" = true WHERE email = 'test@example.com';
```

### Performance Testing
- Load course segments with 50+ comments
- Test admin dashboard with 100+ comments
- Verify real-time updates with multiple users
- Check mobile responsiveness on various devices

### Security Testing
- Attempt to edit/delete other users' comments
- Try accessing admin endpoints without admin privileges
- Test XSS protection with malicious comment content
- Verify proper input sanitization

## Configuration

### Environment Variables
No additional environment variables required beyond standard application configuration.

### Feature Flags
The comment system is always enabled for authenticated users. Admin capabilities are controlled by the `isAdmin` user flag.

### Database Indexes
Ensure these indexes exist for optimal performance:
```sql
-- Comment retrieval by segment
CREATE INDEX comments_segment_created_idx ON app_comment(segmentId, createdAt);

-- Comment threading
CREATE INDEX comments_parent_idx ON app_comment(parentId);

-- User comment history
CREATE INDEX comments_user_created_idx ON app_comment(userId, createdAt);

-- Reply targeting
CREATE INDEX comments_replied_to_idx ON app_comment(repliedToId);
```

## Common Issues & Troubleshooting

### Comments Not Loading
- Check network connectivity and server status
- Verify user authentication status
- Clear browser cache and refresh page
- Check browser console for JavaScript errors

### Admin Dashboard Access Issues
- Confirm user has admin privileges in database
- Check authentication session validity
- Verify admin middleware configuration
- Review server logs for authorization errors

### Performance Issues
- Monitor database query performance
- Check comment volume per segment
- Verify proper pagination implementation
- Review React Query cache configuration

## API Reference

### Comment Operations
```typescript
// Get comments for a segment
getCommentsFn({ data: { segmentId: number } })

// Create new comment
createCommentFn({ 
  data: { 
    segmentId: number,
    content: string,
    parentId: number | null,
    repliedToId: number | null
  }
})

// Update comment
updateCommentFn({ 
  data: { 
    commentId: number,
    content: string
  }
})

// Delete comment
deleteCommentFn({ data: { commentId: number } })
```

### Admin Operations
```typescript
// Get all recent comments (admin only)
getAllRecentCommentsFn({ 
  data: { 
    filterAdminReplied: boolean 
  }
})

// Delete any comment (admin only)
deleteCommentAsAdminFn({ 
  data: { 
    commentId: number 
  }
})
```

## Integration Points

### User Authentication
Comments integrate with the platform's authentication system to:
- Restrict comment creation to logged-in users
- Associate comments with user profiles
- Enable user-specific comment management

### Course Content
Comments are tightly integrated with course segments:
- Each comment belongs to a specific segment
- Comments appear in course learning interface
- Segment context drives comment organization

### Admin System
Admin review capabilities integrate with:
- User role management (isAdmin flag)
- Admin authentication middleware
- Administrative dashboard navigation

## Future Enhancements

### Planned Features
- Real-time notifications for new comments
- Comment reaction system (likes, helpful, etc.)
- Email notifications for admin responses
- Advanced content filtering and auto-moderation
- Analytics dashboard for comment engagement

### Technical Improvements
- WebSocket integration for true real-time updates
- Enhanced mobile experience with gesture controls
- Improved accessibility with screen reader support
- Advanced search and filtering capabilities