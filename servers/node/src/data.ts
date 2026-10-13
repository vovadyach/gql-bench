// createdAt stays a Date (like the NestJS DataService); resolvers format it only when queried
const startTime = Date.now();

export function makeComment(id: number) {
  return {
    id: `comment-${id}`,
    body: `This is comment #${id} with detailed feedback about the post.`,
    authorName: `Commenter_${id % 50}`,
    createdAt: new Date(Date.now() - id * 3600000),
    likes: Math.floor(Math.random() * 100),
  };
}

export function makePost(id: number, commentCount: number) {
  const comments = Array.from({ length: commentCount }, (_, i) => makeComment(id * 100 + i));
  return {
    id: `post-${id}`,
    title: `Understanding Topic #${id}: A Deep Dive`,
    body: `Lorem ipsum dolor sit amet. `.repeat(20),
    status: ['PUBLISHED', 'DRAFT', 'ARCHIVED'][id % 3],
    tags: ['typescript', 'nestjs', 'graphql', 'performance'].slice(0, (id % 4) + 1),
    viewCount: Math.floor(Math.random() * 10000),
    rating: +(Math.random() * 5).toFixed(1),
    createdAt: new Date(Date.now() - id * 86400000),
    comments,
  };
}

export function makeUser(id: number, postCount: number, commentsPerPost: number) {
  const posts = Array.from({ length: postCount }, (_, i) =>
    makePost(id + 100 + i, commentsPerPost),
  );
  const totalViews = posts.reduce((s, p) => s + p.viewCount, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
  const avgRating = posts.length
    ? +(posts.reduce((s, p) => s + p.rating, 0) / posts.length).toFixed(2)
    : 0;

  return {
    id: `user-${id}`,
    name: `User_${id}`,
    email: `user${id}@example.com`,
    role: ['ADMIN', 'EDITOR', 'VIEWER'][id % 3],
    bio: `Developer #${id} who builds scalable apps.`,
    createdAt: new Date(Date.now() - id * 604800000),
    posts,
    stats: { totalPosts: postCount, totalComments, avgRating, totalViews },
  };
}

export function cpuWork(iterations: number): number {
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sin(i) * Math.cos(i);
  }
  return sum;
}

export function getUptime(): number {
  return (Date.now() - startTime) / 1000;
}
