-- Let admins broadcast announcements as pinned posts in the community feed.
alter type post_kind add value if not exists 'announcement';
