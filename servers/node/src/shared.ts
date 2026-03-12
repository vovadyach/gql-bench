import { Injectable } from '@nestjs/common';
import {
  Args,
  Field,
  Query,
  InputType,
  ID,
  Mutation,
  ObjectType,
  registerEnumType,
  Resolver,
  Float,
  Int,
} from '@nestjs/graphql';
import { Type } from 'class-transformer';

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

registerEnumType(UserRole, { name: 'UserRole' });

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(PostStatus, { name: 'PostStatus' });

@ObjectType()
export class Comment {
  @Type(() => Date)
  createdAt: Date;

  id: string;
  body: string;
  authorName: string;
  likes: number;
}

@ObjectType()
export class Post {
  id: string;
  title: string;
  body: string;

  @Field(() => PostStatus)
  status: PostStatus;

  tags: string[];
  viewCount: number;
  rating: number;

  @Type(() => Date)
  createdAt: Date;

  @Field(() => [Comment])
  comments: Comment[];
}

@ObjectType()
export class UserStats {
  totalPosts: number;
  totalComments: number;
  avgRating: number;
  totalViews: number;
}

@ObjectType()
export class User {
  @Type(() => Date)
  createdAt: Date;

  id: string;
  name: string;
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  bio: string;

  @Field(() => [Post])
  posts: Post[];

  @Field(() => UserStats)
  stats: UserStats;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  items: User[];

  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

@ObjectType()
export class SearchResult {
  @Field(() => [User])
  users: User[];

  @Field(() => [Post])
  posts: Post[];

  totalResults: number;
  queryTimeMs: number;
}

@ObjectType()
export class HealthCheck {
  status: string;
  adapter: string;

  @Field(() => Float)
  uptimeSeconds: number;

  timestamp: string;
}

@InputType()
export class CreatePostInput {
  title: string;
  body: string;
  tags?: string[];
}

@InputType()
export class SearchInput {
  query: string;

  @Field({ nullable: true, defaultValue: 10 })
  limit?: number;
}

// ─── Data Generator ────────────────────────────────────
// Generates FAKE data. No database. Identical output
// regardless of which GraphQL engine is running.

@Injectable()
export class DataService {
  private startTime = Date.now();

  makeComment(id: number): Comment {
    return {
      createdAt: new Date(Date.now() - id * 3600000),
      likes: Math.floor(Math.random() * 100),
      id: `comment-${id}`,
      body: `This is comment #${id} with detailed feedback about the post.`,
      authorName: `Commenter_${id % 50}`,
    };
  }

  makePost(id: number, commentCount: number): Post {
    const comments = Array.from({ length: commentCount }, (_, i) => this.makeComment(id * 100 + i));

    return {
      body: `Lorem ipsum dolor sit amet. `.repeat(20),
      comments,
      createdAt: new Date(Date.now() - id * 86400000),
      id: `post-${id}`,
      rating: +(Math.random() * 5).toFixed(1),
      status: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.ARCHIVED][id % 3],
      tags: ['typescript', 'nestjs', 'graphql', 'performance'].slice(0, (id % 4) + 1),
      title: `Understanding Topic #${id}: A Deep Dive`,
      viewCount: Math.floor(Math.random() * 10000),
    };
  }

  makeUser(id: number, postCount: number, commentsPerPost: number): User {
    const posts = Array.from({ length: postCount }, (_, i) =>
      this.makePost(id + 100 + i, commentsPerPost),
    );
    const totalViews = posts.reduce((s, p) => s + p.viewCount, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
    const avgRating = posts.length
      ? +(posts.reduce((s, p) => s + p.rating, 0) / posts.length).toFixed(2)
      : 0;

    return {
      bio: `Developer #${id} who builds scalable apps.`,
      createdAt: new Date(Date.now() - id * 604800000),
      email: `user${id}@example.com`,
      id: `user-${id}`,
      name: `User_${id}`,
      posts,
      role: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER][id % 3],
      stats: {
        totalPosts: postCount,
        totalComments,
        avgRating,
        totalViews,
      },
    };
  }

  cpuWork(iterations: number): number {
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
      sum += Math.sin(i) * Math.cos(i);
    }

    return sum;
  }

  getUpTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}

// ─── Resolver ──────────────────────────────────────────
// Same resolver for Apollo AND Mercurius.
// @nestjs/graphql decorators work with both engines.
@Resolver()
export class BenchResolver {
  constructor(private data: DataService) {}

  @Query(() => HealthCheck)
  health(): HealthCheck {
    return {
      status: 'ok',
      adapter: process.env.ADAPTER || 'Unknown',
      uptimeSeconds: this.data.getUpTime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Query(() => User)
  async user(@Args('id', { type: () => Int, defaultValue: 1 }) id: number): Promise<User> {
    await new Promise((r) => setTimeout(r, 1));
    return this.data.makeUser(id, 3, 2);
  }

  @Query(() => PaginatedUsers)
  async users(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ): Promise<PaginatedUsers> {
    await new Promise((r) => setTimeout(r, 3));
    const items = Array.from({ length: pageSize }, (_, i) =>
      this.data.makeUser((page - 1) * pageSize + i, 3, 2),
    );
    return {
      items,
      total: 100,
      page,
      pageSize,
      hasMore: page + pageSize < 100,
    };
  }

  @Query(() => [User])
  async deepNested(
    @Args('count', { type: () => Int, defaultValue: 5 }) count: number,
  ): Promise<User[]> {
    await new Promise((r) => setTimeout(r, 3));
    this.data.cpuWork(10000);
    return Array.from({ length: count }, (_, i) => this.data.makeUser(i, 10, 8));
  }

  @Query(() => SearchResult)
  async search(@Args('input') input: SearchInput): Promise<SearchResult> {
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 2));
    this.data.cpuWork(10000);
    const limit = input.limit || 10;
    const users = Array.from({ length: Math.min(limit, 20) }, (_, i) =>
      this.data.makeUser(i, 2, 1),
    );
    const posts = users.flatMap((u) => u.posts).slice(0, limit);
    return {
      users,
      posts,
      totalResults: users.length + posts.length,
      queryTimeMs: +(performance.now() - start).toFixed(2),
    };
  }

  @Mutation(() => Post)
  async createPost(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('input') input: CreatePostInput,
  ): Promise<Post> {
    await new Promise((r) => setTimeout(r, 3));

    return {
      id: `post-new-${Date.now()}`,
      title: input.title,
      body: input.body,
      status: PostStatus.DRAFT,
      tags: input.tags || [],
      viewCount: 0,
      rating: 0,
      createdAt: new Date(),
      comments: [],
    };
  }
}
