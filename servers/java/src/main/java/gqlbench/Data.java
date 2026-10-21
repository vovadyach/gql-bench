// Same fake data as servers/node/src/data.ts: same shapes, texts, counts and random fields.
// These records are also the GraphQL types (graphql-java reads their accessors by field name).
// `created` stays an Instant (like the Node and NestJS servers); createdAt() formats it only
// when a query selects createdAt.
package gqlbench;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public final class Data {
  private Data() {}

  public enum UserRole { ADMIN, EDITOR, VIEWER }

  public enum PostStatus { DRAFT, PUBLISHED, ARCHIVED }

  public record Comment(String id, String body, String authorName, int likes, Instant created) {
    public String createdAt() { return iso(created); }
  }

  public record Post(
      String id,
      String title,
      String body,
      PostStatus status,
      List<String> tags,
      int viewCount,
      double rating,
      List<Comment> comments,
      Instant created) {
    public String createdAt() { return iso(created); }
  }

  public record UserStats(int totalPosts, int totalComments, double avgRating, int totalViews) {}

  public record User(
      String id,
      String name,
      String email,
      UserRole role,
      String bio,
      List<Post> posts,
      UserStats stats,
      Instant created) {
    public String createdAt() { return iso(created); }
  }

  public record PaginatedUsers(List<User> items, int total, int page, int pageSize, boolean hasMore) {}

  public record SearchResult(List<User> users, List<Post> posts, int totalResults, double queryTimeMs) {}

  public record HealthCheck(String status, String adapter, double uptimeSeconds, String timestamp) {}

  private static final long START_MS = System.currentTimeMillis();
  private static final UserRole[] ROLES = {UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER};
  private static final PostStatus[] STATUSES = {
    PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.ARCHIVED
  };
  private static final List<String> TAGS = List.of("typescript", "nestjs", "graphql", "performance");
  private static final String POST_BODY = "Lorem ipsum dolor sit amet. ".repeat(20);

  // Same format as JavaScript's toISOString(): 2026-10-13T12:34:56.789Z
  private static final DateTimeFormatter ISO =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

  public static String iso(Instant t) { return ISO.format(t); }

  // Rounds like JavaScript's toFixed for these positive values (half away from zero)
  private static double round(double v, int digits) {
    double p = Math.pow(10, digits);
    return Math.round(v * p) / p;
  }

  public static Comment makeComment(int id) {
    return new Comment(
        "comment-" + id,
        "This is comment #" + id + " with detailed feedback about the post.",
        "Commenter_" + (id % 50),
        ThreadLocalRandom.current().nextInt(100),
        Instant.now().minus(Duration.ofHours(id)));
  }

  public static Post makePost(int id, int commentCount) {
    List<Comment> comments = new ArrayList<>(commentCount);
    for (int i = 0; i < commentCount; i++) comments.add(makeComment(id * 100 + i));
    ThreadLocalRandom random = ThreadLocalRandom.current();
    return new Post(
        "post-" + id,
        "Understanding Topic #" + id + ": A Deep Dive",
        POST_BODY,
        STATUSES[id % 3],
        TAGS.subList(0, id % 4 + 1),
        random.nextInt(10000),
        round(random.nextDouble() * 5, 1),
        comments,
        Instant.now().minus(Duration.ofDays(id)));
  }

  public static User makeUser(int id, int postCount, int commentsPerPost) {
    List<Post> posts = new ArrayList<>(postCount);
    int totalViews = 0, totalComments = 0;
    double ratingSum = 0;
    for (int i = 0; i < postCount; i++) {
      Post p = makePost(id + 100 + i, commentsPerPost);
      posts.add(p);
      totalViews += p.viewCount();
      totalComments += p.comments().size();
      ratingSum += p.rating();
    }
    double avgRating = postCount > 0 ? round(ratingSum / postCount, 2) : 0;
    return new User(
        "user-" + id,
        "User_" + id,
        "user" + id + "@example.com",
        ROLES[id % 3],
        "Developer #" + id + " who builds scalable apps.",
        posts,
        new UserStats(postCount, totalComments, avgRating, totalViews),
        Instant.now().minus(Duration.ofDays(id * 7L)));
  }

  // Same loop as cpuWork in servers/node/src/data.ts
  public static double cpuWork(int iterations) {
    double sum = 0;
    for (int i = 0; i < iterations; i++) sum += Math.sin(i) * Math.cos(i);
    return sum;
  }

  // Millisecond resolution like Node's (Date.now() - startTime) / 1000, so health responses match in size
  public static double uptime() { return (System.currentTimeMillis() - START_MS) / 1000.0; }
}
