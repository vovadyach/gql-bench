# Same fake data as servers/node/src/data.ts: same shapes, texts, counts and random fields.
# `created` stays a datetime (like the Node and NestJS servers); the schema formats it
# only when a query selects createdAt.
import math
import random
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum

_START_MS = time.monotonic_ns() // 1_000_000


class UserRole(Enum):
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"


class PostStatus(Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]
STATUSES = [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.ARCHIVED]
TAGS = ["typescript", "nestjs", "graphql", "performance"]
POST_BODY = "Lorem ipsum dolor sit amet. " * 20


@dataclass(slots=True)
class Comment:
    id: str
    body: str
    author_name: str
    created: datetime
    likes: int


@dataclass(slots=True)
class Post:
    id: str
    title: str
    body: str
    status: PostStatus
    tags: list[str]
    view_count: int
    rating: float
    created: datetime
    comments: list[Comment]


@dataclass(slots=True)
class UserStats:
    total_posts: int
    total_comments: int
    avg_rating: float
    total_views: int


@dataclass(slots=True)
class User:
    id: str
    name: str
    email: str
    role: UserRole
    bio: str
    created: datetime
    posts: list[Post]
    stats: UserStats


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    # Same format as JavaScript's toISOString(): 2026-10-13T12:34:56.789Z
    return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def make_comment(id: int) -> Comment:
    return Comment(
        id=f"comment-{id}",
        body=f"This is comment #{id} with detailed feedback about the post.",
        author_name=f"Commenter_{id % 50}",
        created=now() - timedelta(hours=id),
        likes=random.randrange(100),
    )


def make_post(id: int, comment_count: int) -> Post:
    return Post(
        id=f"post-{id}",
        title=f"Understanding Topic #{id}: A Deep Dive",
        body=POST_BODY,
        status=STATUSES[id % 3],
        tags=TAGS[: id % 4 + 1],
        view_count=random.randrange(10000),
        rating=round(random.random() * 5, 1),
        created=now() - timedelta(days=id),
        comments=[make_comment(id * 100 + i) for i in range(comment_count)],
    )


def make_user(id: int, post_count: int, comments_per_post: int) -> User:
    posts = [make_post(id + 100 + i, comments_per_post) for i in range(post_count)]
    avg_rating = round(sum(p.rating for p in posts) / len(posts), 2) if posts else 0.0
    return User(
        id=f"user-{id}",
        name=f"User_{id}",
        email=f"user{id}@example.com",
        role=ROLES[id % 3],
        bio=f"Developer #{id} who builds scalable apps.",
        created=now() - timedelta(weeks=id),
        posts=posts,
        stats=UserStats(
            total_posts=post_count,
            total_comments=sum(len(p.comments) for p in posts),
            avg_rating=avg_rating,
            total_views=sum(p.view_count for p in posts),
        ),
    )


def cpu_work(iterations: int) -> float:
    total = 0.0
    for i in range(iterations):
        total += math.sin(i) * math.cos(i)
    return total


def uptime() -> float:
    # Millisecond resolution like Node's (Date.now() - startTime) / 1000, so health responses match in size
    return (time.monotonic_ns() // 1_000_000 - _START_MS) / 1000
