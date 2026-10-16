# Strawberry version of schema/benchmark.graphql. Resolvers mirror servers/node/src/resolvers.ts:
# same delays, same CPU work, same data. Field names are snake_case here; Strawberry exposes
# them as camelCase (author_name -> authorName), matching the shared schema.
import asyncio
import os
import time
from typing import Optional

import strawberry
from strawberry.extensions import ParserCache, ValidationCache

import data

ADAPTER = os.environ.get("ADAPTER", "Unknown")

UserRole = strawberry.enum(data.UserRole)
PostStatus = strawberry.enum(data.PostStatus)


# Object types resolve against the plain dataclasses in data.py (`self` is that object).
# createdAt is formatted only when selected, like the Node and NestJS servers.
@strawberry.type
class Comment:
    id: strawberry.ID
    body: str
    author_name: str
    likes: int

    @strawberry.field
    def created_at(self) -> str:
        return data.iso(self.created)


@strawberry.type
class Post:
    id: strawberry.ID
    title: str
    body: str
    status: PostStatus
    tags: list[str]
    view_count: int
    rating: float
    comments: list[Comment]

    @strawberry.field
    def created_at(self) -> str:
        return data.iso(self.created)


@strawberry.type
class UserStats:
    total_posts: int
    total_comments: int
    avg_rating: float
    total_views: int


@strawberry.type
class User:
    id: strawberry.ID
    name: str
    email: str
    role: UserRole
    bio: str
    posts: list[Post]
    stats: UserStats

    @strawberry.field
    def created_at(self) -> str:
        return data.iso(self.created)


@strawberry.type
class PaginatedUsers:
    items: list[User]
    total: int
    page: int
    page_size: int
    has_more: bool


@strawberry.type
class SearchResult:
    users: list[User]
    posts: list[Post]
    total_results: int
    query_time_ms: float


@strawberry.type
class HealthCheck:
    status: str
    adapter: str
    uptime_seconds: float
    timestamp: str


@strawberry.input
class CreatePostInput:
    title: str
    body: str
    tags: Optional[list[str]] = strawberry.UNSET


@strawberry.input
class SearchInput:
    query: str
    limit: Optional[int] = 10


@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> HealthCheck:
        return HealthCheck(
            status="ok",
            adapter=ADAPTER,
            uptime_seconds=data.uptime(),
            timestamp=data.iso(data.now()),
        )

    @strawberry.field
    async def user(self, id: int = 1) -> User:
        await asyncio.sleep(0.001)
        return data.make_user(id, 3, 2)

    @strawberry.field
    async def users(self, page: int = 1, page_size: int = 10) -> PaginatedUsers:
        await asyncio.sleep(0.003)
        items = [data.make_user((page - 1) * page_size + i, 3, 2) for i in range(page_size)]
        return PaginatedUsers(
            items=items,
            total=100,
            page=page,
            page_size=page_size,
            has_more=page + page_size < 100,
        )

    @strawberry.field
    async def deep_nested(self, count: int = 5) -> list[User]:
        await asyncio.sleep(0.003)
        data.cpu_work(10000)
        return [data.make_user(i, 10, 8) for i in range(count)]

    @strawberry.field
    async def search(self, input: SearchInput) -> SearchResult:
        start = time.perf_counter()
        await asyncio.sleep(0.002)
        data.cpu_work(10000)
        limit = input.limit or 10
        users = [data.make_user(i, 2, 1) for i in range(min(limit, 20))]
        posts = [post for user in users for post in user.posts][:limit]
        return SearchResult(
            users=users,
            posts=posts,
            total_results=len(users) + len(posts),
            query_time_ms=round((time.perf_counter() - start) * 1000, 2),
        )


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_post(self, user_id: int, input: CreatePostInput) -> Post:
        await asyncio.sleep(0.003)
        return data.Post(
            id=f"post-new-{int(time.time() * 1000)}",
            title=input.title,
            body=input.body,
            status=data.PostStatus.DRAFT,
            tags=input.tags or [],
            view_count=0,
            rating=0.0,
            created=data.now(),
            comments=[],
        )


# Parse and validation caches: the Node engines (Mercurius, Yoga, Apollo) also cache
# parsed and validated documents, so repeated benchmark queries skip that work everywhere
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[ParserCache(), ValidationCache()],
)
